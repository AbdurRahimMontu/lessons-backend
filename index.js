require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.juobova.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("lessonsDB");
    const lessonCollection = db.collection("lessons");
    //  const likeCollection = db.collection("likes");
    //  const favoriteCollection = db.collection("favorites");
    //  const reportCollection = db.collection("reports");
    const userCollection = db.collection("users");
    const commentCollection = db.collection("comments");

   
     // All Lessons Get Search, Filter, Sort
    app.get("/publicLessons", async (req, res) => {
      const {
        limit,
        skip,
        sort = "createdAt",
        order = "desc",
        search = "",
        category = "",
        tone = "",
      } = req.query;
      const sortKey = sort === "saved" ? "saved" : "createdAt";
      const sortOrder = order === "desc" ? -1 : 1;
      const query = search
        ? { title: { $regex: "^" + search, $options: "i" } }
        : {};
      if (category) {
        query.category = category;
      }
      if (tone) {
        query.emotionalTone = tone;
      }
      const totalLessons = await lessonCollection.countDocuments(query);
      const lessons = await lessonCollection
        .find(query)
        .sort({ [sortKey]: sortOrder })
        .limit(parseInt(limit) || 0)
        .skip(parseInt(skip) || 0)
        .toArray();
      res.send({ lessons, totalLessons });
    });


  // Featured Lessons Get
    app.get("/featuredLessons", async (req, res) => {
      const result = await lessonCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray();

      res.send(result);
    });


    // Single Details Lesson Get
    app.get("/publicLessons/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await lessonCollection.findOne(query);
      res.send(result);
    });



    // My Post Lessons All
    app.get("/myLessons", async (req, res) => {
      const email = req.query.email;
      const result = await lessonCollection.find({ email: email }).toArray();
      res.send(result);
    });












  

    //Single Lesson Post
    app.post("/allLessons", async (req, res) => {
      const addLesson = req.body;
      const result = await lessonCollection.insertOne(addLesson);
      res.send(result);
    });



// 
app.get("/publicLessons/creator/:id", async (req, res) => {
  const { id } = req.params;

  const lessons = await lessonCollection
    .find({
      "creator._id": new ObjectId(id)
    })
    .toArray();

  res.send({
    totalLessons: lessons.length,
    lessons
  });
});


// GET /lessons author
app.get("/lessons", async (req, res) => {
  const lessons = await lessonCollection.find().toArray();
  const totalLessons = await lessonCollection.countDocuments();

  res.send({
    lessons,
    totalLessons
  });
});






    // user save
    app.post("/user", async (req, res) => {
      try {
        const userData = req.body;
        userData.created_at = new Date().toISOString();
        userData.last_loggedIn = new Date().toISOString();
        userData.role = "customer";
        const query = { email: userData.email };

        const alreadyExists = await userCollection.findOne(query);

        if (alreadyExists) {
          console.log("Updating user info");

          const result = await userCollection.updateOne(query, {
            $set: {
              last_loggedIn: new Date().toISOString(),
              name: userData.name,
            },
          });

          return res.send(result);
        }

        console.log("Saving new user");

        // NEW USER 

        const result = await userCollection.insertOne(userData);

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server Error", error });
      }
    });

    // total get user 
    app.get("/users", async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })


    //get a user role
    app.get("/user/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send({ role: result?.role });
    });
 

    // comments

    app.post("/comments", async (req, res) => {
      const { lessonId, userEmail, userName, comment } = req.body;

      const newComment = {
        lessonId,
        userEmail,
        userName,
        comment,
        createdAt: new Date(),
      };

      const result = await commentCollection.insertOne(newComment);
      res.send(result);
    });

    app.get("/comments/:lessonId", async (req, res) => {
      const lessonId = req.params.lessonId;
      const comments = await commentCollection
        .find({ lessonId })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(comments);
    });


















    // Lessons Similar 
    app.get("/lessons/similar/:id", async (req, res) => {
      const id = req.params.id;
      const current = await lessonCollection.findOne({ _id: new ObjectId(id) });

      if (!current) return res.send([]);

      const similar = await lessonCollection
        .find({
          category: current.category,
          _id: { $ne: current._id },
        })
        .limit(6)
        .toArray();

      res.send(similar);
    });




    app.get("/lessons/recommended/:id", async (req, res) => {
      const id = req.params.id;
      const current = await lessonCollection.findOne({ _id: new ObjectId(id) });

      if (!current) return res.send([]);

      const recommended = await lessonCollection
        .find({
          emotionalTone: current.emotionalTone,
          _id: { $ne: current._id },
        })
        .limit(6)
        .toArray();

      res.send(recommended);
    });






    //Payment checkout

    app.post("/payment/create-checkout-session", async (req, res) => {
      try {
        const paymentInfo = req.body;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],

          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Premium Access",
                  description:
                    "Lifetime premium access to Digital Life Lessons",
                },
                unit_amount: 1500 * 100,
              },
              quantity: 1,
            },
          ],

          mode: "payment",
          customer: paymentInfo.stripeCustomerId,
          success_url: `${process.env.FRONTEND_URL}/payment-success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,

          metadata: {
            userEmail: paymentInfo.userEmail || "unknown",
          },
        });

        res.json({ url: session.url });
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Port is Running No ${port}`);
});
