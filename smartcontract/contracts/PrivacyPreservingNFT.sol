// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;
import "./PoseidonT4.sol";
import "./CurveBabyJubJub.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrivacyPreservingNFT is ERC721URIStorage, Ownable{

    struct Bid{
        address bidder;
        uint256[2] publickey;
        uint256 amount; 
    }

    struct Token{
        uint256[2] publickey;
        uint256 commitment;
        uint256[3] enc_keys;
        bool on_sale;
        Bid highest_bid;
    }

    uint256 public token_ID;
    mapping(uint256 => Token) public id_to_token;
    mapping(uint256 => Bid) id_to_oldbid; //amount in this case is what he should earn
    PoseidonT4 poseidon;

    constructor() ERC721("PrivacyPreservingNFT","PPN") Ownable(){
        token_ID = 0;
        poseidon = new PoseidonT4();
    }

    /*
    * @dev check if the sender is the owner of the token
    * @param tokenId id of the token
    */
    modifier onlyNFTOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "not the owner of this token");
        _;
    }

    /*
    * @dev check if the token is not solved yet (not accepted or denied)
    * @param tokenId id of the token
    */
    modifier solvedNFT(uint256 tokenId) {
        require(id_to_oldbid[tokenId].publickey[0] == uint256(0) && id_to_oldbid[tokenId].publickey[1] == uint256(0),"token must still be accepted");
        _;
    }

    /*
    * @dev mint a new token
    * @param owner address of the owner of the token
    * @param token_URI URI of the token
    * @param owner_publickey public key of the owner
    * @param token_commitment commitment of the token
    * @return the id of the token
    */
    function mint_token(address owner, string memory token_URI, uint256[2] memory owner_publickey,
                        uint256 token_commitment) public onlyOwner returns (uint256){
        require(CurveBabyJubJub.isOnCurve(owner_publickey[0], owner_publickey[1]), "public key not on curve");

        _safeMint(owner,token_ID);
        _setTokenURI(token_ID, token_URI);
        id_to_token[token_ID] = Token(owner_publickey,token_commitment,[uint256(0),uint256(0),uint256(0)],true,Bid(address(0),[uint256(0),uint256(0)],0));

        token_ID++;
        return token_ID - 1;
    }

    /*
    * @dev toggle the for sale status of a token
    * @param tokenId id of the token
    */
    function toggle_forsale(uint256 tokenId) public onlyNFTOwner(tokenId) solvedNFT(tokenId){
        id_to_token[tokenId].on_sale = !id_to_token[tokenId].on_sale;
    }

    /*
    * @dev place a bid on a token
    * @param tokenId id of the token
    * @param bidder_publickey public key of the bidder compatible with the curve baby jubjub
    */
    function place_bid(uint256 tokenId, uint256[2] memory bidder_publickey) public solvedNFT(tokenId) payable{
        require(CurveBabyJubJub.isOnCurve(bidder_publickey[0], bidder_publickey[1]), "public key not on curve");
        require(msg.sender != ownerOf(tokenId),"it is not possible to bid on its own token");
        
        Token memory token = id_to_token[tokenId];
        Bid memory token_bid = token.highest_bid;

        require(token.on_sale,"token is not for sale");
        require(msg.value > token_bid.amount, "bid must be higher than the current one");

        if(token_bid.bidder != address(0))
            payable(token_bid.bidder).transfer(token_bid.amount);

        id_to_token[tokenId].highest_bid = Bid(msg.sender,bidder_publickey,msg.value);
    }

    /*
    * @dev accept a bid on a token
    * @param tokenId id of the token
    * @param enc_keys encrypted keys of the token in order to decrypt the keys used to encrypt the token
    */
    function accept_bid(uint256 tokenId, uint256[3] memory enc_keys) public onlyNFTOwner(tokenId) solvedNFT(tokenId){
        Token memory token = id_to_token[tokenId];
        Bid memory token_bid = token.highest_bid;

        require(token_bid.bidder != address(0),"no bids recived yet");
        id_to_token[tokenId].highest_bid = Bid(address(0),[uint256(0),uint256(0)],0);
        id_to_token[tokenId].publickey = token_bid.publickey;
        id_to_token[tokenId].on_sale = false;
        id_to_token[tokenId].enc_keys = enc_keys;

        safeTransferFrom(msg.sender, token_bid.bidder, tokenId);

        id_to_oldbid[tokenId] = Bid(msg.sender,[token.publickey[0],token.publickey[1]],token_bid.amount);
    }

    /*
    * @dev confirm the reception of the keys, that means the transfer of the token is complete and the bidder can decrypt the token 
    * @param tokenId id of the token
    */
    function confirm_transfer(uint256 tokenId) public onlyNFTOwner(tokenId){
        require(id_to_oldbid[tokenId].publickey[0] != uint256(0) && id_to_oldbid[tokenId].publickey[1] != uint256(0),"token is not pending");
        id_to_token[tokenId].enc_keys = [uint256(0),uint256(0),uint256(0)];

        payable(id_to_oldbid[tokenId].bidder).transfer(id_to_oldbid[tokenId].amount);
        delete id_to_oldbid[tokenId];
    }

    /*
    * @dev deny the reception of the keys, that means the transfer of the token is not complete and the bidder can't decrypt the token
    * @param tokenId id of the token
    * @param privatekey private key of the new owner of the token
    */
    function deny_transfer(uint256 tokenId, uint256 privatekey) public onlyNFTOwner(tokenId){
        require(id_to_oldbid[tokenId].publickey[0] != uint256(0) && id_to_oldbid[tokenId].publickey[1] != uint256(0),"token is not pending");
        
        (uint256 x, uint256 y) = CurveBabyJubJub.pointMul(uint256(995203441582195749578291179787384436505546430278305826713579947235728471134),
                                                          uint256(5472060717959818805561601436314318772137091100104008585924551046643952123905),
                                                          privatekey);
        require((x == id_to_token[tokenId].publickey[0]) && (y == id_to_token[tokenId].publickey[1]), "privatekey of the bidder is not valid");
        

        uint256[2] memory publickey = [id_to_oldbid[tokenId].publickey[0],id_to_oldbid[tokenId].publickey[1]];

        (uint256 DH_x, uint256 DH_y) = CurveBabyJubJub.pointMul(publickey[0],publickey[1],privatekey);
        uint256[3] memory decrypted_keys;

        for (uint8 i = 0; i < 3; i++) 
            // CIM_KEY = RO(K_ab) ^ ENC_CIM_KEY
            decrypted_keys[i] = uint256(keccak256(abi.encodePacked(DH_x,DH_y,i))) ^ id_to_token[tokenId].enc_keys[i]; //bit-wise XOR encryption 
        uint256 new_commitment = poseidon.hash(decrypted_keys);

        require(new_commitment == id_to_token[tokenId].commitment, "encrypted keys received are correct");
        _burn(tokenId);
        payable(msg.sender).transfer(id_to_oldbid[tokenId].amount);
    }

    function change_publickey(uint256 tokenId, uint256[2] memory new_publickey) public onlyNFTOwner(tokenId){
        id_to_token[tokenId].publickey = new_publickey;
    }

}
