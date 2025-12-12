import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from "./contractAddress.js";
import './App.css';

const ABI = [
  "function addTodo(string memory _text) external",
  "function toggleTodo(uint256 _index) external",
  "function deleteTodo(uint256 _index) external",
  "function getTodos() external view returns (tuple(string text, bool completed)[] memory)",
  "event TodoAdded(address indexed user, uint256 index, string text)",
  "event TodoToggled(address indexed user, uint256 index, bool completed)",
  "event TodoDeleted(address indexed user, uint256 index)"
];

function App() {
  const [account, setAccount] = useState('');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setContract(contractInstance);
        loadTodos(contractInstance);
      } catch (err) {
        alert("MetaMask connection failed");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const loadTodos = async (contractInstance) => {
    if (!contractInstance) return;
    setLoading(true);
    try {
      const data = await contractInstance.getTodos();
      setTodos(data.map((todo, i) => ({ index: i, text: todo.text, completed: todo.completed })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !contract) return;
    setLoading(true);
    try {
      const tx = await contract.addTodo(newTodo);
      await tx.wait();
      setNewTodo('');
      loadTodos(contract);
    } catch (err) {
      alert("Failed to add todo");
    }
    setLoading(false);
  };

  const toggleTodo = async (index) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.toggleTodo(index);
      await tx.wait();
      loadTodos(contract);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const deleteTodo = async (index) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.deleteTodo(index);
      await tx.wait();
      loadTodos(contract);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (contract) loadTodos(contract);
  }, [contract]);

  return (
    <div className="App">
      <h1>Web3 Todo App (Ethereum Sepolia)</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect MetaMask</button>
      ) : (
        <div>
          <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <div className="input-container">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Enter a new todo"
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            />
            <button onClick={addTodo} disabled={loading}>Add Todo</button>
          </div>
          {loading && <p>Loading...</p>}
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.index} className={todo.completed ? 'completed' : ''}>
                <span onClick={() => toggleTodo(todo.index)}>{todo.text}</span>
                <button onClick={() => deleteTodo(todo.index)} className="delete">×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;