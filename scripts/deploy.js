const hre = require("hardhat");

async function main() {
  console.log("Deploying TodoList contract...");

  const TodoList = await hre.ethers.getContractFactory("TodoList");
  const todoList = await TodoList.deploy();

  await todoList.waitForDeployment();
  console.log("TodoList deployed to:", todoList.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });