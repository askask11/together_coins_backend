const express = require('express');
const router = express.Router();
const verify = require('../models/verify');
const db = require('../models/db');
const ResponseJson = require('../models/responseJson');

router.use(verify.checkLogin);

// 🔑 /task/list
// Request: GET
// Params: by (me/them), completed (true/false)
// Response: List of tasks categorized by status
router.get('/list', async (req, resp) => {
    try {
        const userId = verify.getUserId(req);
        const bindUserId = verify.getBindUserId(req) || userId;
        const by = req.query.by || 'me';
        const completed = req.query.completed === 'true';

        const query = `SELECT * FROM tasks WHERE by_user=? AND status ${completed ? '=3' : '!=3'}`;
        const results = await db.query(query, by === 'me' ? userId : bindUserId);

        const inProgressTasks = [];
        const toBeAcceptedTasks = [];
        const completedTasks = [];

        results[0].forEach(task => {
            if (task.status === 1) inProgressTasks.push(task);
            else if (task.status === 0) toBeAcceptedTasks.push(task);
            else if (task.status === 3) completedTasks.push(task);
        });

        resp.status(200).send(
            ResponseJson.ok({
                in_progress_tasks: inProgressTasks,
                to_be_accepted_tasks: toBeAcceptedTasks,
                completed_tasks: completedTasks,
            })
        );
    } catch (e) {
        console.error(e);
        resp.status(500).send(ResponseJson.error());
    }
});

// 🔑 /task/list/:task_id
// Request: GET
// Params: task_id
// Response: Task details
router.get('/list/:task_id', async (req, resp) => {
    try {
        const userId = verify.getUserId(req);
        const bindUserId = verify.getBindUserId(req) || userId;
        const taskId = req.params.task_id;

        const [results] = await db.query('SELECT * FROM tasks WHERE task_id=?', [taskId]);

        if (!results.length) return resp.status(404).send(ResponseJson.err('Task not found'));

        const task = results[0];
        if (task.by_user !== userId && task.by_user !== bindUserId)
            return resp.status(403).send(ResponseJson.err('You are not authorized to view this task'));

        resp.status(200).send(ResponseJson.ok(task));
    } catch (e) {
        console.error(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
});

// 🔑 /task/create
// Request: POST
// Body: title, description, num_days, num_days_accept, amount
// Response: Created task ID
router.post('/create', verify.cleanUpBody, async (req, resp) => {
    try {
        const userId = verify.getUserId(req);
        const { title, description, num_days = 7, num_days_accept = num_days, amount = 0 } = req.body;

        if (!title || !description)
            return resp.status(400).send(ResponseJson.noParamMsg('Missing required fields'));

        if (
            isNaN(num_days) ||
            isNaN(num_days_accept) ||
            num_days < 1 ||
            num_days_accept < 1 ||
            num_days_accept > num_days ||
            amount < 0
        )
            return resp.status(400).send(ResponseJson.err('Invalid input for num_days or num_days_accept'));

        const query =
            'INSERT INTO tasks (by_user, title, description, num_days, num_days_accept, num_coins) VALUES (?, ?, ?, ?, ?, ?)';
        const [results] = await db.query(query, [userId, title, description, num_days, num_days_accept, amount]);

        resp.status(201).send(ResponseJson.ok({ task_id: results.insertId }));
    } catch (e) {
        console.error(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
});

// 🔑 /task/edit
// Request: POST
// Body: task_id, title, description, num_days, num_days_accept, amount
// Response: Task updated
router.post('/edit', verify.cleanUpBody, async (req, resp) => {
    try {
        const userId = verify.getUserId(req);
        const { task_id, title, description, num_days, num_days_accept, amount } = req.body;

        if (!task_id || !title || !description || !num_days || !num_days_accept)
            return resp.status(400).send(ResponseJson.noParamMsg('Missing required fields'));

        if (
            isNaN(num_days) ||
            isNaN(num_days_accept) ||
            num_days < 1 ||
            num_days_accept < 1 ||
            num_days_accept > num_days
        )
            return resp.status(400).send(ResponseJson.err('Invalid input for num_days or num_days_accept'));

        const [results] = await db.query('SELECT * FROM tasks WHERE task_id=?', [task_id]);
        if (!results.length) return resp.status(404).send(ResponseJson.err('Task not found'));

        const task = results[0];
        if (task.by_user !== userId)
            return resp.status(403).send(ResponseJson.err('You are not authorized to edit this task'));

        const query =
            'UPDATE tasks SET title=?, description=?, num_days=?, num_days_accept=?, num_coins=? WHERE task_id=?';
        await db.query(query, [title, description, num_days, num_days_accept, amount, task_id]);

        resp.status(200).send(ResponseJson.ok('Task updated'));
    } catch (e) {
        console.error(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
});

// 🔑 /task/status
// Request: POST
// Body: task_id, status
// Response: Task status updated
router.post('/status', verify.cleanUpBody, async (req, resp) => {
    try {
        const userId = verify.getUserId(req);
        const { task_id, status } = req.body;

        if (isNaN(status) || status < 0 || status > 3)
            return resp.status(400).send(ResponseJson.err('Invalid status'));

        //call sql PROCEDURE to update it to avoid long query here!
        const [result] = await db.query('CALL UpdateTaskStatus(?, ?, ?)', [task_id, userId, status]);

        //

        resp.status(200).send(ResponseJson.ok('Task status updated'));

        /* if (result[0]?.message === 'ok') {
            resp.status(200).send(ResponseJson.ok('Task status updated'));
        } else {
            resp.status(403).send(ResponseJson.err('You are not authorized to update this task'));
        } */
    } catch (e) {
        console.error(e);
        resp.status(500).send(ResponseJson.sqlError());
    }
});

module.exports = router;
