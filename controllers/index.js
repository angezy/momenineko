class Controller {
    // Define methods for handling requests here
    getExample(req, res) {
        res.send('This is an example response');
    }

    postExample(req, res) {
        const data = req.body;
        res.json({ message: 'Data received', data });
    }
}

module.exports = new Controller();