// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TodoList {
    struct Todo {
        string text;
        bool completed;
    }

    mapping(address => Todo[]) private userTodos;

    event TodoAdded(address indexed user, uint256 index, string text);
    event TodoToggled(address indexed user, uint256 index, bool completed);
    event TodoDeleted(address indexed user, uint256 index);

    function addTodo(string memory _text) external {
        require(bytes(_text).length > 0, "Empty todo");
        userTodos[msg.sender].push(Todo({text: _text, completed: false}));
        emit TodoAdded(msg.sender, userTodos[msg.sender].length - 1, _text);
    }

    function toggleTodo(uint256 _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        userTodos[msg.sender][_index].completed = !userTodos[msg.sender][_index]
            .completed;
        emit TodoToggled(
            msg.sender,
            _index,
            userTodos[msg.sender][_index].completed
        );
    }

    function deleteTodo(uint256 _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        // Move last item to deleted spot and pop
        userTodos[msg.sender][_index] = userTodos[msg.sender][
            userTodos[msg.sender].length - 1
        ];
        userTodos[msg.sender].pop();
        emit TodoDeleted(msg.sender, _index);
    }

    function getTodos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }
}
