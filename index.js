const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;




app.use(cors({
    origin: [
        "http://localhost:5173"
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());



const varifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).send({ message: "Not Authprozed" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unAuthorized" })
        }
        req.user = decoded;
        next();
    })
}



const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster001.04aawtx.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const assignmentCollection = client.db("StudyBuddyHub").collection("assignments");
const submittedAssignmentCollection = client.db("StudyBuddyHub").collection("submittedassignments");



async function run() {
    try {

        app.get('/', (req, res) => {
            res.send('amigos')
        })
        app.post('/assignment', async (req, res) => {
            const assignment = req.body;
            const result = await assignmentCollection.insertOne(assignment)
            res.send(result);
        })

        app.get('/assignmentcount', async (req, res) => {
            const count = await assignmentCollection.estimatedDocumentCount();
            res.send({ assignment: count })
        })

        app.get('/assignment', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const result = await assignmentCollection.find().skip(page * size).limit(size).toArray();
            res.send(result);
        });


        // app.get('/assignment', async (req, res) => {
        //     if(req.query.diffLevel){
        //         query = {difficultyLevel : req.query.diffLevel}
        //     }
        //     const result = await assignmentCollection.find(query).toArray();
        //     res.send(result);
        //     console.log(result);
        // })



        app.get('/assignment/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(filter);
            res.send(result);
        })

        app.put('/assignment/:id',async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const info = req.body;
            const option = { upsert: true };
            const updateInfo = {
                $set: {
                    name: info.name,
                    title: info.title,
                    desc: info.desc,
                    marks: info.mark,
                    image: info.image,
                    difficultyLevel: info.diffLevel,
                    startDate: info.startDate
                }
            }
            const result = await assignmentCollection.updateOne(query, updateInfo, option);
            res.send(result);
            console.log(result);
        })


        app.post('/submittedAssign', async (req, res) => {
            const submittedAssignment = req.body;
            const result = await submittedAssignmentCollection.insertOne(submittedAssignment)
            res.send(result);
        })
        app.get('/submittedAssign', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await submittedAssignmentCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/submittedAssign/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await submittedAssignmentCollection.deleteOne(filter);
            res.send(result);
            console.log(result);
        })
        app.patch('/submittedAssign/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedInfo = req.body;
            const doc = {
                $set: {
                    status: updatedInfo.status,
                }
            }
            console.log(updatedInfo);

            const result = await submittedAssignmentCollection.updateOne(filter, doc);
            res.send(result);
        })

        // jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
            res
                .cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })
        app.post('/logout', async (req, res) => {
            res.clearCookie("token", { maxAge: 0 }).send({ success: true })
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