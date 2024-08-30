import React, { useRef, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button, Container, Row, Col, Alert, Form } from 'react-bootstrap';

// Import your contract ABI and address here
import NFTArtCreatorABI from './NFTArtCreatorABI.json';
const CONTRACT_ADDRESS = '0x05D0AcA3ba12f010f6A26104da5cB83419723842';

const NFTArtCreator = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState(null);
  const [color, setColor] = useState('#000000'); // Default color is black

  useEffect(() => {
    const setupEthers = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const nftContract = new ethers.Contract(CONTRACT_ADDRESS, NFTArtCreatorABI, signer);
          setContract(nftContract);
          setAccount(await signer.getAddress());

          const network = await provider.getNetwork();
          setNetwork(network.name);
        } catch (error) {
          console.error("Failed to connect to Ethereum:", error);
          setError("Failed to connect to Ethereum. Please make sure you're connected to the correct network.");
        }
      } else {
        setError("Please install MetaMask!");
      }
    };

    setupEthers();
  }, []);

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    ctx.strokeStyle = color; // Set the stroke color
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const mintNFT = async () => {
    if (!contract || !account) {
      setError("Please connect to MetaMask first");
      return;
    }

    const canvas = canvasRef.current;
    const imageDataUrl = canvas.toDataURL("image/png");

    try {
      // Log the contract address and ABI for debugging
      console.log("Contract address:", CONTRACT_ADDRESS);
      console.log("Contract ABI:", NFTArtCreatorABI);

      // Check if the safeMint function exists
      if (typeof contract.safeMint !== 'function') {
        throw new Error("safeMint function not found in the contract");
      }

      // Estimate gas before sending the transaction
      const gasEstimate = await contract.safeMint.estimateGas(account, imageDataUrl);
      console.log("Estimated gas:", gasEstimate.toString());

      const tx = await contract.safeMint(account, imageDataUrl, { gasLimit: gasEstimate });
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("NFT minted successfully!", receipt);
      setError(null);
    } catch (error) {
      console.error("Error minting NFT:", error);
      setError(`Error minting NFT: ${error.message}`);
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center vh-100">
      <div className="d-flex flex-column justify-content-center align-items-center">
        <h1>Ducky</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>Connected Account: {account || "Not connected"}</p>
        <Form.Group>
          <Form.Label>Select Color:</Form.Label>
          <Form.Control
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: '100px', height: '50px', margin: '10px auto' }}
          />
        </Form.Group>
        <canvas
          ref={canvasRef}
          width={600} // Increased width
          height={600} // Increased height
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          style={{ border: '2px solid black', margin: '20px auto' }}
        />
        <br />
        <Button
          onClick={mintNFT}
          disabled={!account}
          style={{ padding: '15px 30px', fontSize: '18px', marginTop: '20px' }} // Increased button size
        >
          Mint NFT
        </Button>
      </div>
    </Container>
  );
};

export default NFTArtCreator;