import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Connection, Keypair, SystemProgram } from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccount,
    getOrCreateAssociatedTokenAccount,
    mintTo,
} from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@project-serum/anchor";
import idl from "../idl.json";
import {
    adminKeyPair,
    adminKeyPairTyke,
    stakingProgram,
    stakingProgramTyke,
    stakingTokenMint,
} from "../utils/constans";

const SmartContractActions = ({ endpoint }) => {
    const { publicKey, wallet, connected } = useWallet();
    const [userInfoPDA, setUserInfoPDA] = useState();

    useEffect(()=>{
        if(connected){
            const tykeAdminKeyPair = Keypair.fromSeed(publicKey.toBytes());
            console.log({tykeAdminKeyPair: tykeAdminKeyPair?.publicKey?.toString(), publicKey:publicKey.toString()})
        }
    }, [connected])

    // const stakingTokenMint = new PublicKey(
    //     "84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE",
    // );
    // const admin = new PublicKey("DG6ZWtgMqYo4P9wsjF5vetosPZmthk33AxJCgeBEY7nr");
    // const adminKeyPair2 = Keypair.fromSeed(admin?.toBytes());
    // console.log({adminKeyPair2:adminKeyPair2})
    // console.log({adminKeyPair2:adminKeyPair2.publicKey.toString()})
    // console.log({adminKeyPairconst: adminKeyPair})
    // console.log({adminKeyPairconst: adminKeyPair.publicKey.toString()})
    // const poolInfo = new PublicKey(
    //     "FjT1Wwp3scx1x4bCnVpGyAUoPDMT1GVmAu2VAGzT16hB",
    // );
    // const poolKeyPair = Keypair.fromSeed(poolInfo?.toBytes());
    // const userInfo = Keypair.generate();
    // // localStorage.setItem("userInfo", JSON.stringify(userInfo))
    // console.log(userInfo);

    // const publicKeyArray = Uint8Array.from(
    //     Object.values(userInfo._keypair.publicKey),
    // );
    // const secretKeyArray = Uint8Array.from(
    //     Object.values(userInfo._keypair.secretKey),
    // );
    // const publicKeyNew = new PublicKey(publicKeyArray);
    // const _keypair = {
    //     publicKey: publicKeyNew,
    //     secretKey: secretKeyArray,
    // };
    // // Convert to Base58 string (Solana public address)
    // const publicAddress = publicKeyNew.toBase58();

    // console.log("Public Address:", publicAddress, publicKeyNew);
    const opts = { preflightCommitment: "processed" };

    const connection = new Connection(endpoint, opts.preflightCommitment);
    const provider = new AnchorProvider(
        connection,
        wallet?.adapter,
        opts.preflightCommitment,
    );

    // const program = new Program(idl, stakingProgram, provider);
    const program = new Program(idl, stakingProgramTyke, provider);
    
    const poolInfoPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_info"), stakingTokenMint.toBuffer()],
        program.programId,
    )[0];
    
    const fetchTransaction = async (
        txSignature,
        commitment = "confirmed",
        retries = 5,
        delay = 2000,
        connection,
    ) => {
        let attempt = 0;
        while (attempt < retries) {
            attempt++;
            try {
                const tx = await connection.getTransaction(txSignature, {
                    commitment: "confirmed", // Ensure to use the correct commitment level
                });

                if (tx) {
                    console.log("Transaction logs: ", tx.meta.logMessages);
                    return tx; // Return the transaction if found
                } else {
                    console.log(
                        `Attempt ${attempt}: Transaction not found, retrying...`,
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
                }
            } catch (error) {
                console.log(`Attempt ${attempt} failed:`, error);
                await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
            }
        }

        console.log("Transaction not confirmed after multiple attempts.");
        return null;
    };

    const initializeContract = async () => {
        try {
            console.log({adminKeyPairTyke: adminKeyPairTyke.publicKey.toString()})
            // const adminTokenAccount = await createAssociatedTokenAccount(
            //     connection,
            //     adminKeyPairTyke,
            //     stakingTokenMint,
            //     adminKeyPairTyke.publicKey,
            // );
          
            // const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
            //     connection,
            //     adminKeyPairTyke,
            //     stakingTokenMint,
            //     adminKeyPairTyke.publicKey,
            // );
            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                adminKeyPair.publicKey,
            );

            const accounts = {
                // admin: adminKeyPairTyke.publicKey,
                admin: adminKeyPair.publicKey,
                poolInfo: poolInfoPDA,
                stakingToken: stakingTokenMint,
                adminStakingWallet: adminTokenAccount.address,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };

            const accounts2 = {
                admin: adminKeyPairTyke.publicKey.toString(),
                adminStakingWallet: adminTokenAccount.address.toString(),
                stakingToken: stakingTokenMint.toString(),
                poolInfo: poolInfoPDA.toString(),
                tokenProgram: TOKEN_PROGRAM_ID.toString(),
                systemProgram: SystemProgram.programId.toString(),
            };

            const args = [
                {
                    pairs: [
                        {
                            lockSeconds: new BN(14),
                            poolSize: new BN(10_000_000_000),
                            userLimit: new BN(3_000_000_000),
                            rewardPercentage: new BN(50),
                        },
                        {
                            lockSeconds: new BN(28),
                            poolSize: new BN(20_000_000_000),
                            userLimit: new BN(6_000_000_000),
                            rewardPercentage: new BN(60),
                        },
                        {
                            lockSeconds: new BN(36),
                            poolSize: new BN(30_000_000_000),
                            userLimit: new BN(9_000_000_000),
                            rewardPercentage: new BN(70),
                        },
                        {
                            lockSeconds: new BN(48),
                            poolSize: new BN(40_000_000_000),
                            userLimit: new BN(12_000_000_000),
                            rewardPercentage: new BN(80),
                        },
                    ],
                },
            ];

            console.log({ accounts, accounts2 });

            // const tx = await program.methods
            //     .initialize(args[0].pairs)
            //     .accounts(accounts)
            //     .signers([adminKeyPairTyke])
            //     .rpc();
            const tx = await program.methods
                .initialize(args[0].pairs)
                .accounts(accounts)
                .signers([adminKeyPair])
                .rpc();

            console.log("Transaction successful:", tx);
        } catch (error) {
            console.error("Error initializing contract:", error);
        }
    };

    const stake = async (stakeAmount) => {
        try {
            const userWallet = provider.wallet.publicKey;

            const userStakingWallet = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                userWallet,
            );

            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPairTyke,
                stakingTokenMint,
                adminKeyPairTyke.publicKey,
                );
            // const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
            //     connection,
            //     adminKeyPair,
            //     stakingTokenMint,
            //     adminKeyPair.publicKey,
            //     );

            console.log({ userWallet, userStakingWallet: userStakingWallet.owner.toString(), adminTokenAccount });

            const accounts = {
                user: userWallet,
                admin: adminKeyPairTyke.publicKey,
                // admin: adminKeyPair.publicKey,
                userInfo: userInfoPDA,
                userStakingWallet: userStakingWallet.address,
                adminStakingWallet: adminTokenAccount.address,
                stakingToken: stakingTokenMint,
                poolInfo: poolInfoPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };

            const accounts2 = {
                user: userWallet.toString(),
                admin: adminKeyPairTyke.publicKey.toString(),
                // admin: adminKeyPair.publicKey.toString(),
                userInfo: userInfoPDA?.toString(),
                userStakingWallet: userStakingWallet.address.toString(),
                adminStakingWallet: adminTokenAccount.address.toString(),
                stakingToken: stakingTokenMint.toString(),
                poolInfo: poolInfoPDA.toString(),
                tokenProgram: TOKEN_PROGRAM_ID.toString(),
                systemProgram: SystemProgram.programId.toString(),
            };

            const time = new BN(2);
            const bnAmount = new BN(1e9);

            console.log({time, bnAmount: bnAmount.toString(), accounts, accounts2 });

            const tx = await program.methods
                .stake(time, bnAmount)
                .accounts(accounts)
                .signers([adminKeyPairTyke])
                .rpc();
            // const tx = await program.methods
            //     .stake(time, bnAmount)
            //     .accounts(accounts)
            //     .signers([adminKeyPair])
            //     .rpc();

            console.log("Stake transaction successful:", tx);

            const txSignature = tx;
            const result = await fetchTransaction(
                txSignature,
                "confirmed",
                5,
                2000,
                connection,
            );

            if (result) {
                const logMessages = result.meta.logMessages;

                console.log(logMessages);
            } else {
                console.log("Transaction not confirmed.");
            }
        } catch (error) {
            console.error("Error staking tokens:", error);
        }
    };

    const unStake = async () => {
        try {
            const userWallet = provider.wallet.publicKey;

            const userStakingWallet = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                userWallet,
            );

            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                adminKeyPair.publicKey,
            );

            console.log({
                userWallet,
                userStakingWallet,
                adminTokenAccount,
            });

            const accounts = {
                user: userWallet,
                admin: adminKeyPair.publicKey,
                userInfo: userInfoPDA,
                userStakingWallet: userStakingWallet.address,
                adminStakingWallet: adminTokenAccount.address,
                stakingToken: stakingTokenMint,
                poolInfo: poolInfoPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };

            const accounts2 = {
                user: userWallet.toString(),
                admin: adminKeyPair.publicKey.toString(),
                userInfo: userInfoPDA,
                userStakingWallet: userStakingWallet.address.toString(),
                adminStakingWallet: adminTokenAccount.address.toString(),
                stakingToken: stakingTokenMint.toString(),
                poolInfo: poolInfoPDA.toString(),
                tokenProgram: TOKEN_PROGRAM_ID.toString(),
                systemProgram: SystemProgram.programId.toString(),
            };

            console.log({ accounts, accounts2 });

            const tx = await program.methods
                .unstake()
                .accounts(accounts)
                .signers([adminKeyPair])
                .rpc();

            console.log("Stake transaction successful:", tx);
        } catch (error) {
            console.error("Error staking tokens:", error);
        }
    };

    const claimReward = async () => {
        try {
            const userWallet = provider.wallet.publicKey;

            const userStakingWallet = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                userWallet,
            );

            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                adminKeyPair.publicKey,
            );

            console.log({
                userWallet,
                userStakingWallet,
                adminTokenAccount,
            });

            const accounts = {
                user: userWallet,
                admin: adminKeyPair.publicKey,
                userInfo: userInfoPDA,
                userStakingWallet: userStakingWallet.address,
                adminStakingWallet: adminTokenAccount.address,
                stakingToken: stakingTokenMint,
                // poolInfo: poolInfoPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                // systemProgram: SystemProgram.programId,
            };

            const accounts2 = {
                user: userWallet.toString(),
                admin: adminKeyPair.publicKey.toString(),
                userInfo: userInfoPDA,
                userStakingWallet: userStakingWallet.address.toString(),
                adminStakingWallet: adminTokenAccount.address.toString(),
                stakingToken: stakingTokenMint.toString(),
                // poolInfo: poolInfoPDA.toString(),
                tokenProgram: TOKEN_PROGRAM_ID.toString(),
                // systemProgram: SystemProgram.programId.toString(),
            };

            console.log({ accounts, accounts2 });

            const tx = await program.methods
                .claimReward()
                .accounts(accounts)
                .signers([adminKeyPair])
                .rpc();

            console.log("Stake transaction successful:", tx);
        } catch (error) {
            console.error("Error staking tokens:", error);
        }
    };

    const updatePool = async () => {
        try {

            const userWallet = provider.wallet.publicKey;

            const userStakingWallet = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                userWallet,
            );

            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                adminKeyPair,
                stakingTokenMint,
                adminKeyPair.publicKey,
            );

            console.log({
                userWallet,
                userStakingWallet,
                adminTokenAccount,
            });

            const accounts = {
                user: userWallet,
                admin: adminKeyPair.publicKey,
                userInfo: publicKey,
                userStakingWallet: userStakingWallet.address,
                adminStakingWallet: adminTokenAccount.address,
                stakingToken: stakingTokenMint,
                poolInfo: poolKeyPair.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };

            const accounts2 = {
                user: userWallet.toString(),
                admin: adminKeyPair.publicKey.toString(),
                userInfo: publicKey.toString(),
                userStakingWallet: userStakingWallet.address.toString(),
                adminStakingWallet: adminTokenAccount.address.toString(),
                stakingToken: stakingTokenMint.toString(),
                poolInfo: poolKeyPair.publicKey.toString(),
                tokenProgram: TOKEN_PROGRAM_ID.toString(),
                systemProgram: SystemProgram.programId.toString(),
            };

            console.log({ accounts, accounts2 });

            const index = 1; // Index to update
            const newDetail = {
                lockSeconds: new BN(14),
                poolSize: new BN(20000000000000),
                userLimit: new BN(3000000000),
                rewardPercentage: new BN(50),
            };

            const tx = await program.methods
                .updatePoolDetail(index, newDetail)
                .accounts({
                    admin: adminKeyPair.publicKey, // Admin account required here
                    poolInfo: poolKeyPair.publicKey,
                })
                .signers([adminKeyPair]) // Unauthorized user
                .rpc();

            console.log("Stake transaction successful:", tx);
        } catch (error) {
            console.error("Error staking tokens:", error);
        }
    };

    useEffect(() => {
        console.log("Wallet connected:", connected);

        if(connected){
            const userinfoPDA = PublicKey.findProgramAddressSync(
                [Buffer.from("user_info"), publicKey?.toBuffer()],
                program.programId,
            )[0];
            setUserInfoPDA(userinfoPDA);

            console.log("Public Key:", publicKey?.toString());
            // console.log({ poolInfoPDA: poolInfoPDA.toString() });
            console.log({ userinfoPDA: userinfoPDA?.toString() });
        }
    }, [connected]);

    const handleInitialize = async () => {
        if (!connected || !publicKey) {
            console.error("No wallet connected or public key missing!");
            return;
        }
        await initializeContract(wallet.adapter); // Initialize contract
    };

    const handleStake = async () => {
        if (!connected || !publicKey) {
            console.error("No wallet connected or public key missing!");
            return;
        }

        const stakeAmount = 4e9; // Example: Stake 4 tokens
        await stake(stakeAmount); // Call the passed onStake function
    };

    const handleUnStake = async () => {
        if (!connected || !publicKey) {
            console.error("No wallet connected or public key missing!");
            return;
        }

        await unStake(); // Call the passed onStake function
    };

    const handleUpdate = async () => {
        if (!connected || !publicKey) {
            console.error("No wallet connected or public key missing!");
            return;
        }

        await updatePool(); // Call the passed onStake function
    };

    const handleClaimReward = async () => {
        if (!connected || !publicKey) {
            console.error("No wallet connected or public key missing!");
            return;
        }

        await claimReward(); // Call the passed onStake function
    };

    return (
        <div className="base-container">
            <button
                onClick={handleInitialize}
                disabled={false}
            >
                Initialize Contract
            </button>
            <button
                onClick={handleStake}
                disabled={!connected}
            >
                Stake
            </button>
            <button
                onClick={handleUnStake}
                disabled={!connected}
            >
                Unstake
            </button>
            <button
                onClick={handleUpdate}
                disabled={true}
            >
                Update Pool
            </button>
            <button
                onClick={handleClaimReward}
                // disabled={true}
            >
                Claim Reward
            </button>
        </div>
    );
};

export default SmartContractActions;
