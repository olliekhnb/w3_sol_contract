import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import contract from './utils/WavePortal.json';
import {TailSpin} from 'react-loader-spinner';

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");

  const [messageOfTheDay, setMessageOfTheDay] = useState("");

  const [writer, setWriter] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [todayReads, setTodayReads] = useState(0);

  const [totalReads, setTotalReads] = useState(0);

  const contractAddress = "0xb2CaBF14C3CBdA5A9564087dC4d5Dce33c19127b";

  const contractABI = contract.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Garanta que possua a Metamask instalada!");
        return;
      } else {
        console.log("Temos o objeto ethereum", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Encontrada a conta autorizada:", account);
        setCurrentAccount(account)
      } else {
        console.log("Nenhuma conta autorizada foi encontrada")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implemente aqui o seu método connectWallet
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("MetaMask encontrada!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Conectado", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const updateReadNumbers = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      
      let count = await wavePortalContract.getReads();
      setTotalReads(count[0].toNumber());
      setTodayReads(count[1].toNumber());
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  useEffect(() => {
    updateReadNumbers();
  }, [])

  const wave = async () => {

    let suggestion = document.getElementById("suggestionBox").value;

    try {
      const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      const alreadyWaved = await wavePortalContract.checkUserSentMessage();

      if (alreadyWaved) {
        setIsLoading(true);
        const message = await wavePortalContract.getMessageOfTheDay();
        setMessageOfTheDay(message.message);
        setWriter(message.writer);
        if (suggestion != "") {
          alert("Sua sugestão não será registrada pois você já deixou uma sugestão hoje.");
        }
      } 
      else {
        if (suggestion == "") {
          alert("Você precisa dar uma sugestão antes de receber a frase do dia.")
          return;
        }  

        setIsLoading(true);

        const waveTxn = await wavePortalContract.receiveMessageOfTheDay(suggestion, {gasLimit: 300000});
        console.log("Minerando...", waveTxn.hash);

        let message = await waveTxn.wait();
        console.log("Minerado -- ", waveTxn.hash);    
        message = message.events[0].args[0];
        setMessageOfTheDay(message.message);
        setWriter(message.writer);

        let count = await wavePortalContract.getReads();
        setTotalReads(count[0].toNumber());
        setTodayReads(count[1].toNumber());
      }
    } else {
      console.log("Objeto Ethereum não encontrado!");
    }
  } catch (error) {
    setIsLoading(false);
    console.log(error);
  }
}
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Bem-vindo!
        </div>

        <div className="bio">
        Olá, eu sou o JG10 e estou aqui para te passar uma mensagem. Conecte sua wallet Ethereum, deixe sua sugestão e veja a frase do dia!
        </div>

        <input type="text" id="suggestionBox" placeholder="Insira sua sugestão de frase..." style={{marginTop:"12px", textAlign:"center", padding:"4px"}}>
        </input>

        {!currentAccount ? (
            <button className="waveButton" onClick={connectWallet}>
              Conectar carteira
            </button>
          ) : (
            <button className="waveButton" onClick={wave}>
              Me mostre a frase do dia!!!
            </button>
          )
        }
        {messageOfTheDay != "" ? (
          <div className="message">
            <br/>
            A frase do dia é:
            <h4 style={{fontWeight: "bold"}}>
              {messageOfTheDay}.   
            </h4>
            {`Sugestão de ${writer}`}.
          </div>
          ) : (
            <div className="message">
              {isLoading && 
                <div>
                  <h4 style={{fontWeight: "bold"}}>
                    Carregando a frase do dia...   
                  </h4>
                  <TailSpin
                    height="80"
                    width="80"
                    color="#d9d9d6"
                    ariaLabel="tail-spin-loading"
                    radius="1"
                    wrapperStyle={{ justifyContent: "center" }}
                    wrapperClass=""
                    visible={true}
                  />
                </div>
              }
            </div>
          )
        }
        {currentAccount === "" ? (
          <div className="footer-container">
            <h6
              className="footer-text"
            >{"Conecte sua carteira para ver quantas pessoas já pediram a frase do dia."}</h6>
          </div>
        ) : (
          <div className="footer-container">
            <h6 className="footer-text">
              {`${todayReads} pessoas já pediram a frase de hoje.`}
            </h6>
            <h6 className="footer-text">
              {`${totalReads} pessoas já pediram as frases do dia.`}
            </h6>
          </div>
        )}
      </div>
    </div>
  );
}
