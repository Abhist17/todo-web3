import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from './contractAddress.js';
import './App.css';

const ABI = [
  "function addTodo(string memory _text) external",
  "function toggleTodo(uint256 _index) external",
  "function deleteTodo(uint256 _index) external",
  "function getTodos() external view returns (tuple(string text, bool completed)[] memory)",
];

function App() {
  const [account, setAccount] = useState('');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask is required");
    setConnecting(true);
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
      alert("Wallet connection failed");
    }
    setConnecting(false);
  };

  const loadTodos = async (c) => {
    if (!c) return;
    setLoading(true);
    try {
      const data = await c.getTodos();
      setTodos(data.map((t, i) => ({ index: i, text: t.text, completed: t.completed })));
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
      alert("Failed to add – check gas or network");
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
      setLoading(false);
    }
  };

  const deleteTodo = async (index) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.deleteTodo(index);
      await tx.wait();
      loadTodos(contract);
    } catch (err) {
      setLoading(false);
    }
  };

  const startEdit = (index, text) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const saveEdit = async () => {
    if (!editText.trim() || !contract) return;
    setLoading(true);
    try {
      // Delete old and add new (since no edit function in contract)
      await deleteTodo(editingIndex);
      const tx = await contract.addTodo(editText);
      await tx.wait();
      setEditingIndex(null);
      setEditText('');
      loadTodos(contract);
    } catch (err) {
      alert("Edit failed");
      setLoading(false);
    }
  };

  const clearCompleted = async () => {
    if (!contract || todos.filter(t => t.completed).length === 0) return;
    setLoading(true);
    try {
      for (let i = todos.length - 1; i >= 0; i--) {
        if (todos[i].completed) {
          await deleteTodo(i);
        }
      }
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) loadTodos(contract);
  }, [contract]);

  const activeTodos = todos.filter(t => !t.completed).length;
  const completedTodos = todos.filter(t => t.completed).length;

  return (
    <div className="app-container">
      <div className="card">
        <h1>Web3 Todo</h1>
        <p className="subtitle">On-Chain Task Manager • Ethereum Sepolia</p>

        {!account ? (
          <button className="connect-btn" onClick={connectWallet} disabled={connecting}>
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <>
            <div className="status-bar">
              <span className="wallet">Wallet: {account.slice(0, 8)}...{account.slice(-6)}</span>
              <span className="deployed">Deployed</span>
            </div>

            <div className="add-section">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task..."
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                disabled={loading}
              />
              <button onClick={addTodo} disabled={loading || !newTodo.trim()}>
                Add
              </button>
            </div>

            {loading && <div className="loader">Syncing blockchain...</div>}

            <div className="todo-stats">
              <span>{activeTodos} active</span>
              <span>{completedTodos} completed</span>
              {completedTodos > 0 && (
                <button onClick={clearCompleted} className="clear-btn">
                  Clear Completed
                </button>
              )}
            </div>

            <ul className="todo-list">
              {todos.length === 0 ? (
                <p className="empty-state">No tasks yet. Add one to get started!</p>
              ) : (
                todos.map((todo) => (
                  <li key={todo.index} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                    {editingIndex === todo.index ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                      />
                    ) : (
                      <span onClick={() => toggleTodo(todo.index)} className="todo-text">
                        {todo.text}
                      </span>
                    )}
                    <div className="actions">
                      {editingIndex === todo.index ? (
                        <button onClick={saveEdit} className="save-btn">Save</button>
                      ) : (
                        <button onClick={() => startEdit(todo.index, todo.text)} className="edit-btn">Edit</button>
                      )}
                      <button onClick={() => deleteTodo(todo.index)} className="delete-btn">×</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>

      <footer className="footer">
        Contract:{' '}
        <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">
          {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
        </a>
      </footer>
    </div>
  );
}

export default App;