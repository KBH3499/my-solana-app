import { useState, useEffect } from "react";
import "../assets/style/NFTGallery.css"; // Import the CSS file
import { useWallet } from "@solana/wallet-adapter-react"; // Import wallet hooks
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { generateSigner } from "@metaplex-foundation/umi";
import {
  create,
  fetchAsset,
  fetchCollection,
} from "@metaplex-foundation/mpl-core";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import bs58 from "bs58"; // ✅ Import bs58 for Base58 encoding
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

export default function NFTGallery({ umi, endpoint }) {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missingNFTs, setMissingNFTs] = useState([]);
  const [page, setPage] = useState(1); // To keep track of the page number
  const wallet = useWallet(); // Get wallet information
  const { publicKey, signTransaction, connected } = wallet; // Get wallet information
  const connection = new Connection(endpoint);

  // Function to fetch NFTs for a specific page
  const fetchNFTs = async (pageNumber) => {
    setLoading(true);

    const totalNFTs = 12; // Number of NFTs to fetch per page
    let fetchedNFTs = [];
    let missing = [];

    const nftPromises = Array.from({ length: totalNFTs }, (_, i) => {
      const id = (pageNumber - 1) * totalNFTs + i + 1; // Calculate NFT ID based on page number
      const url = `https://nft.ikigaionsol.com/media/IKI_${id}.json`;

      return fetch(url)
        .then(async (response) => {
          if (!response.ok) throw new Error(`NFT #${id} not found`);
          const nftData = await response.json();

          // Convert image to blob for CORS handling
          nftData.image = await fetchImageAsBlob(nftData.image);
          return nftData;
        })
        .catch(() => {
          missing.push(id);
          return null;
        });
    });

    const results = await Promise.allSettled(nftPromises);

    fetchedNFTs = results
      .filter((res) => res.status === "fulfilled" && res.value)
      .map((res) => res.value);
    if (nfts?.length > 0) {
      setNfts((prevNfts) => [...prevNfts, ...fetchedNFTs]); // Add new NFTs to the existing ones
    } else {
      setNfts(fetchedNFTs);
    }
    setMissingNFTs(missing);
    setLoading(false);

    console.log(
      `Loaded NFTs: ${fetchedNFTs.length}, Missing: ${missing.length}`
    );
  };

  useEffect(() => {
    fetchNFTs(page); // Fetch the NFTs for the first page when the component mounts
  }, [page]);

  // Fetch image as a blob to avoid CORS issues
  const fetchImageAsBlob = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Image blocked: ${url}`);

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return "fallback.png"; // Return fallback if the image fails
    }
  };

  const loadMore = () => {
    setPage((prevPage) => prevPage + 1); // Increment page number to fetch next set of NFTs
  };

  // Function to create an asset
  const createAsset = async (assetId) => {
    let assets = [];
    if (!publicKey || !connected) {
      console.error("Wallet not connected");
      return;
    }

    const BASE_URL = `https://nft.ikigaionsol.com/media/${assetId}.json`;

    // Token and admin addresses (use actual addresses here)
    const tokenAddress = new PublicKey(
      "84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE"
    );
    const adminAddress = new PublicKey(
      "DG6ZWtgMqYo4P9wsjF5vetosPZmthk33AxJCgeBEY7nr"
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      tokenAddress,
      publicKey
    );
    const adminTokenAccount = await getAssociatedTokenAddress(
      tokenAddress,
      adminAddress
    );

    try {
      let collection;

      const collectionAddress = new PublicKey(
        "3SsoHng2czRKa1Prdsihgm95DdKpo9Wi2F6yB8ANN8zi"
      );

      collection = await fetchCollection(umi, collectionAddress);
      console.log(`Fetched Collection Address: ${collection.publicKey}`);

      if (!wallet || !wallet.publicKey) {
        console.error(
          "Phantom wallet is not connected or publicKey is missing."
        );
        return;
      }

      // Fetch the latest blockhash for transaction finalization
      const { blockhash } = await connection.getLatestBlockhash();

      // Create the transfer instruction
      const transferInstruction = createTransferCheckedInstruction(
        userTokenAccount, // Sender's token account
        tokenAddress, // Token address (mint address)
        adminTokenAccount, // Receiver's token account
        wallet.publicKey, // Sender's public key (signer)
        0.1 * 10 ** 9, // Amount (5 tokens with 9 decimals)
        9 // Token decimals
      );

      // Create a new transaction
      const transferTx = new Transaction().add(transferInstruction);

      // Set blockhash and fee payer
      transferTx.recentBlockhash = blockhash;
      transferTx.feePayer = wallet.publicKey;

      // Sign transaction with wallet
      const signedTx = await signTransaction(transferTx);

      // Send transaction
      const transferSignature = await connection.sendRawTransaction(
        signedTx.serialize()
      );

      // Confirm transaction
      await connection.confirmTransaction(
        transferSignature,
        "finalized"
      );


      console.log(`Token transfer successful: ${transferSignature}`);

      if (transferSignature) {

        const assetAddress = generateSigner(umi);
        console.log(`Creating asset: ${assetAddress.publicKey}`);
        umi.use(walletAdapterIdentity(wallet));

        const transaction = create(umi, {
          asset: assetAddress,
          collection: collection.publicKey,
          owner: umi.identity.publicKey,
          authority: umi.identity.publicKey,
          name: `IKIGAI NFT`,
          uri: BASE_URL,
        });

        // ✅ Ensure `txSignature` is Base58 encoded
        const txSignatureUint8Array = (await transaction.sendAndConfirm(umi))
          .signature;
        const txSignature = bs58.encode(txSignatureUint8Array); // Convert Uint8Array to Base58

        console.log(`Asset creation confirmed with signature: ${txSignature}`);

        // ✅ Ensure finalization before fetching asset
        await connection.confirmTransaction(txSignature, "finalized");
        console.log("Transaction finalized on-chain.");

        // ✅ Retry fetching the asset with a delay
        let asset;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            asset = await fetchAsset(umi, assetAddress.publicKey);
            console.log(`Fetched Asset Details: ${asset.publicKey}`);
            assets.push(asset);
            return assetAddress.publicKey;
          } catch (error) {
            console.warn(`Retrying asset fetch (Attempt ${attempt + 1}/5)...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }

        console.error("Failed to fetch asset after multiple attempts.");
      }
    } catch (error) {
      console.error("Error in token transfer:", error);
    }
  };

  // const get = async () => {
  //   // const updateAuthority = 
  //   const data = await fetchCollection(umi, new PublicKey("3SsoHng2czRKa1Prdsihgm95DdKpo9Wi2F6yB8ANN8zi"));
  //   console.log(data)    
  // }
  // useEffect(()=>{
  //   get()
  // },[])

  return (
    <div className="gallery-container">
      <h1 className="title">NFT Collection</h1>

      {loading ? (
        <p className="loading-text">Loading NFTs...</p>
      ) : (
        <>
          <p className="stats">
            Loaded {nfts.length} NFTs | Missing {missingNFTs.length}
          </p>
          <div className="nft-grid">
            {nfts.map((nft, index) => (
              <div key={index} className="nft-card">
                <img src={nft.image} alt={nft.name} className="nft-image" />
                <h3 className="nft-name">{nft.name}</h3>
                <button
                  className="mint-button"
                  onClick={()=>createAsset(nft.name)} // Call createAsset when mint button is clicked
                >
                  Mint
                </button>
              </div>
            ))}
          </div>
          <button className="load-more-button" onClick={loadMore}>
            Load More
          </button>
        </>
      )}
    </div>
  );
}
