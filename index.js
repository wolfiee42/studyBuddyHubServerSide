const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;




app.use(cors({
    origin: [
        "http://localhost:5173"
    ],
    credentials: true,
}))
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster001.04aawtx.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const assignmentCollection = client.db("StudyBuddyHub").collection("assignments");



async function run() {
    try {

        app.get('/', (req, res) => {
            res.send('amigos')
        })
        app.post('/assignments', async (req, res) => {
            const assignment = req.body;
            const result = await assignmentCollection.insertOne(assignment)
            res.send(result);
            console.log(result);
        })
        app.get('/assignment', async(req, res)=>{
            const result = await assignmentCollection.find().toArray();
            res.send(result);
            console.log(result);
        })


        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`port in running on ${port}`);
})