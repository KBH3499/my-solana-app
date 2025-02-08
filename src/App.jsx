import React, { useEffect, useMemo, useState } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import SmartContractActions from "./components/SmartContractActions";
import NftManager from "./components/NftManager";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { updateData } from "./utils/helper";

const App = () => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  const umi = createUmi(endpoint);
  
  const [isStakeUnstake, setIsStakeUnstake] = useState(false);
  const [isMintNFT, setIsMintNFT] = useState(false);

  useEffect(()=>{
    updateData()
  },[])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="content-container">
            <h1>Solana Wallet Adapter with React</h1>
            <WalletMultiButton />
            <div className="base-container">
              {!isMintNFT && (
                <button onClick={() => setIsStakeUnstake(!isStakeUnstake)}>
                  {isStakeUnstake ? "Return to Home" : "Stake / Unstake"}
                </button>
              )}
              {!isStakeUnstake && (
                <button onClick={() => setIsMintNFT(!isMintNFT)}>
                  {isMintNFT ? "Return to Home" : "Mint NFT"}
                </button>
              )}
            </div>
            {isStakeUnstake && <SmartContractActions endpoint={endpoint} />}
            {isMintNFT && <NftManager umi={umi} endpoint={endpoint}/>}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
