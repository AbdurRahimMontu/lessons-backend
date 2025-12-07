const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config()
// , ObjectId

app.use(cors());
app.use(express.json())

app.get('/', (req,res)=>{
    res.send('Server is running')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.juobova.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    const db = client.db('lessonsDB')
    const lesson = db.collection('lessons')

 app.get('/allLessons', async (req,res)=>{
    const result = await lesson.find().toArray()
    res.send(result)
})

 app.get('/allLessons/:id', async (req,res)=>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await lesson.findOne(query)
    res.send(result)
})


app.post('/allLessons',async (req,res)=>{
  const addLesson = req.body
  const result = await lesson.insertOne(addLesson)
  res.send(result)
})






    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`Port is Running No ${port}`);
})
