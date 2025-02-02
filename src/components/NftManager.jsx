import React from "react";
import NFTGallery from "./NFTGallery";

const NftManager = ({ umi, endpoint }) => {
    return (
        <div className="base-container">
           <NFTGallery umi={umi} endpoint={endpoint}/>
        </div>
    );
};

export default NftManager;
