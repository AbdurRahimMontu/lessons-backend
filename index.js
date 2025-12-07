const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config()


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
    await client.connect();

   const db = client.db('lessonsDB')
   const lessonCollection = db.collection('lessons')
   const likeCollection = db.collection("likes");
   const favoriteCollection = db.collection("favorites");
   const reportCollection = db.collection("reports");


  // All Lessons Get
 app.get('/allLessons', async (req,res)=>{
    const result = await lessonCollection.find().toArray()
    res.send(result)
})

  // Single Lesson Get
 app.get('/allLessons/:id', async (req,res)=>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await lessonCollection.findOne(query)
    res.send(result)
})

  //Single Lesson Post
app.post('/allLessons',async (req,res)=>{
  const addLesson = req.body
  const result = await lessonCollection.insertOne(addLesson)
  res.send(result)
})

  // My Post Lessons All
app.get('/myLessons', async (req, res) => {
  const email = req.query.email;
  const result = await lessonCollection.find({ email: email }).toArray();
  res.send(result);
});



app.get("/lessons/:id", async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: "Not found" });

  const userId = req.user._id;

  res.json({
    ...lesson.toObject(),
    liked: lesson.likedBy.includes(userId),
  });
});





















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
