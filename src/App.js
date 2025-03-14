import { useState, useEffect } from 'react';
import { SparkWallet } from '@buildonspark/spark-sdk';

function useWallet() {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const savedMnemonic = localStorage.getItem('sparkMnemonic');

    const initializeWallet = async (mnemonic) => {
      try {
        const { wallet } = await SparkWallet.create({ mnemonicOrSeed: mnemonic });
        setWallet(wallet);
      } catch (err) {
        console.error('Error loading wallet:', err);
        createNewWallet();
      }
    };

    const createNewWallet = async () => {
      try {
        const { wallet, mnemonic } = await SparkWallet.create({});
        localStorage.setItem('sparkMnemonic', mnemonic);
        setWallet(wallet);
      } catch (err) {
        console.error('Error creating wallet:', err);
      }
    };

    if (savedMnemonic) {
      initializeWallet(savedMnemonic);
    } else {
      createNewWallet();
    }
  }, []);

  return wallet;
}

function useInvoiceAndBalance(wallet) {
  const [balance, setBalance] = useState(null);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (!wallet) return;

    const fetchInvoice = async () => {
      try {
        const amount = 1000;
        const memo = 'Test invoice';
        const newInvoice = await wallet.createLightningInvoice({ amountSats: amount, memo });
        setInvoice(newInvoice);
        console.log('Invoice created:', newInvoice);
        startBalancePolling();
      } catch (error) {
        console.error('Error creating invoice:', error);
      }
    };

    const fetchBalance = async () => {
      try {
        const balanceData = await wallet.getBalance(true);
        setBalance(balanceData.balance);
        console.log('Refetched balance:', balanceData);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    const startBalancePolling = () => {
      fetchBalance();
      window.balanceInterval = setInterval(fetchBalance, 10000);
    };

    fetchInvoice();

    return () => {
      if (window.balanceInterval) {
        clearInterval(window.balanceInterval);
      }
    };
  }, [wallet]);

  return { balance, invoice };
}

function App() {
  const wallet = useWallet();
  const { balance, invoice } = useInvoiceAndBalance(wallet);

  if (!wallet) {
    return <div>Loading wallet...</div>;
  }

  return (
    <div className="App">
      <p>Spark Wallet Demo</p>
      {<p>Balance: {balance?.toString() ?? '0'}</p>}
      {invoice && <p style={{
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        maxWidth: '100%',
        overflowWrap: 'break-word'
      }}>{invoice}</p>}
    </div>
  );
}

export default App;
