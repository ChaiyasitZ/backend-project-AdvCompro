const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();
const app = express();

app.log = console.log;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// get all todos
app.get('/api/todos', async (req, res) => {
    const todos = await db.todoList.findMany({
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            tasks: {
                select: {
                    isCompleted: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    res.status(200).send({
        status: 200,
        message: "Success: Todos retrieved.",
        data: todos.map(todo => {
            return {
                id: todo.id,
                title: todo.title,
                description: todo.description,
                category: todo.category,
                completed: todo.tasks.length > 0 && todo.tasks.every(task => task.isCompleted),
            }
        })
    });
});

// create todo
app.post('/api/todos', async (req, res) => {
    const { title, description } = req.body;
    const todo = await db.todoList.create({
        data: {
            title,
            description,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            tasks: true
        }
    });
    res.status(200).send({
        status: 200,
        message: "Success: Todo created.",
        data: todo
    });
});

// get todo by id
app.get('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const todo = await db.todoList.findUnique({
        where: {
            id: parseInt(id)
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            tasks: true
        },
    });
    if (!todo) {
        res.status(404).send({
            status: 404,
            message: "Error: Todo not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Todo retrieved.",
        data: {
            id: todo.id,
            title: todo.title,
            description: todo.description,
            category: todo.category,
            completed: todo.tasks.length > 0 && todo.tasks.every(task => task.isCompleted),
            tasks: todo.tasks
        }
    });
});

// update todo
app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const todo = await db.todoList.update({
        where: {
            id: parseInt(id)
        },
        data: {
            title,
            description
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            tasks: true
        },
    });
    if (!todo) {
        res.status(404).send({
            status: 404,
            message: "Error: Todo not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Todo updated.",
        data: {
            id: todo.id,
            title: todo.title,
            description: todo.description,
            category: todo.category,
            completed: todo.tasks.length > 0 && todo.tasks.every(task => task.isCompleted),
            tasks: todo.tasks
        }
    });
});

// delete todo
app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const tasks = await db.task.deleteMany({
        where: {
            todoListId: parseInt(id)
        }
    });
    const todo = await db.todoList.delete({
        where: {
            id: parseInt(id)
        },
        include: {
            tasks: true
        }
    });
    if (!todo) {
        res.status(404).send({
            status: 404,
            message: "Error: Todo not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Todo deleted.",
        data: todo
    });
});

// create task
app.post('/api/todos/:id/tasks', async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const task = await db.task.create({
        data: {
            name: title,
            todoListId: parseInt(id)
        }
    });
    res.status(200).send({
        status: 200,
        message: "Success: Task created.",
        data: task
    });
});

// update task
app.patch('/api/todos/:id/tasks/:taskId', async (req, res) => {
    const { id, taskId } = req.params;
    const taskCompleted = await db.task.findFirst({
        where: {
            id: parseInt(taskId),
            todoListId: parseInt(id)
        },
        select: {
            isCompleted: true
        }
    });
    if (!taskCompleted) {
        res.status(404).send({
            status: 404,
            message: "Error: Task not found.",
            data: null
        });
    }
    const task = await db.task.update({
        where: {
            id: parseInt(taskId)
        },
        data: {
            isCompleted: !taskCompleted.isCompleted
        }
    });
    res.status(200).send({
        status: 200,
        message: "Success: Task updated.",
        data: task
    });
});

// delete task
app.delete('/api/todos/:id/tasks/:taskId', async (req, res) => {
    const { id, taskId } = req.params;
    const task = await db.task.delete({
        where: {
            id: parseInt(taskId),
            todoListId: parseInt(id)
        }
    });
    if (!task) {
        res.status(404).send({
            status: 404,
            message: "Error: Task not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Task deleted.",
        data: task
    });
});

// get all category
app.get('/api/category', async (req, res) => {
    const category = await db.category.findMany();
    res.status(200).send({
        status: 200,
        message: "Success: category retrieved.",
        data: category
    });
});

// create category
app.post('/api/category', async (req, res) => {
    const { name } = req.body;
    const category = await db.category.create({
        data: {
            name
        }
    });
    res.status(200).send({
        status: 200,
        message: "Success: Category created.",
        data: category
    });
});

// get category by id
app.get('/api/category/:id', async (req, res) => {
    const { id } = req.params;
    const category = await db.category.findUnique({
        where: {
            id: parseInt(id)
        },
        include: {
            todoLists: {
                include: {
                    tasks: {
                        select: {
                            isCompleted: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        },
    });
    if (!category) {
        res.status(404).send({
            status: 404,
            message: "Error: Category not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Category retrieved.",
        data: {
            category: {
                id: category.id,
                name: category.name,
            },
            todos: category.todoLists.map(todo => ({
                id: todo.id,
                title: todo.title,
                description: todo.description,
                completed: todo.tasks.length > 0 && todo.tasks.every(task => task.isCompleted),
            }))
        }
    });
});

// insert todo to category
app.post('/api/category/:id', async (req, res) => {
    // insert todo to category
    const { id } = req.params;
    const { title, description } = req.body;
    const todo = await db.todoList.create({
        data: {
            title,
            description,
            category: {
                connect: {
                    id: parseInt(id)
                }
            }
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    if (!todo) {
        res.status(404).send({
            status: 404,
            message: "Error: Todo not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Todo created.",
        data: todo
    });
});

// update todo to category
app.put('/api/category/:id', async (req, res) => {
    // insert todo to category
    const { id } = req.params;
    const { todoId } = req.body;
    const todo = await db.todoList.findUnique({
        where: {
            id: parseInt(todoId)
        }
    });
    if (!todo) {
        res.status(404).send({
            status: 404,
            message: "Error: Todo not found.",
            data: null
        });
    }
    const category = await db.category.update({
        where: {
            id: parseInt(id)
        },
        data: {
            todoLists: {
                connect: {
                    id: todo.id
                }
            }
        }
    });
    if (!category) {
        res.status(404).send({
            status: 404,
            message: "Error: Category not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Category updated.",
        data: category
    });
});

// delete todo to category
app.patch('/api/category/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const category = await db.category.update({
        where: {
            id: parseInt(id)
        },
        data: {
            name
        }
    });
    if (!category) {
        res.status(404).send({
            status: 404,
            message: "Error: Category not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Category updated.",
        data: category
    });
});

// delete category
app.delete('/api/category/:id', async (req, res) => {
    const { id } = req.params;
    const category = await db.category.delete({
        where: {
            id: parseInt(id)
        }
    });
    if (!category) {
        res.status(404).send({
            status: 404,
            message: "Error: Category not found.",
            data: null
        });
    }
    res.status(200).send({
        status: 200,
        message: "Success: Category deleted.",
        data: category
    });
});

app.listen(8080, () => app.log(`Server is running on http://localhost:8080`));