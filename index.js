const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");

const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.n1li6q4.mongodb.net/?appName=Cluster0`;
const port = process.env.PORT || 3000;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware
const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found!",
    });
  }

  const token = authorization.split(" ")[1];
  try {
    await admin.auth().verifyIdToken(token);
    // console.log('succsess')

    next();
  } catch (error) {
    res.status(401).send({
      message: "unauthorized access.",
    });
  }
};

async function run() {
  try {
    const db = client.db("movieMaster");
    const moviesCollection = db.collection("movies");
    const usersCollection = db.collection("users");
    const watcListCollection = db.collection("watchlist");
    // load all movies
    app.get("/movies", async (req, res) => {
      const result = await moviesCollection.find().toArray();
      res.send(result);
    });

    // load id specific movie

    app.get("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.findOne(query);
      res.send(result);
    });

    // adding new movie

    app.post("/movies/add", verifyToken, async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await moviesCollection.insertOne(data);
      res.send(result);
    });

    // update movie
    app.put("/movies/update/:id",verifyToken, async (req, res) => {
      const { id } = req.params;
      const data = req.body;

      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };

      const result = await moviesCollection.updateOne(filter, update);

      res.send(result);
    });

    // delete a movie
    app.delete("/movies/:id",  async (req, res) => {
      const { id } = req.params;
      //    const objectId = new ObjectId(id)
      // const filter = {_id: objectId}
      const result = await moviesCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // getting data for my_collection page
    app.get("/my-collection", verifyToken, async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      const result = await moviesCollection.find({ addedBy: email }).toArray();
      res.send(result);
    });

    // adding new users
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        res.send({ message: "user already exists" });
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
      
    });


    // watch list -
    app.post("/watchlist/add", async(req, res) => {
      const listData = req.body;
      const id = req.body.movie_id
      const query = {movie_id: id};
      const existingItem = await watcListCollection.findOne(query);

      if (existingItem) {
         res.send({ message: "already exists" });
      } else {
        const result = await watcListCollection.insertOne(listData);
        res.send({message: "added to list"});
      }
    })


    // getting data for watchlist
    app.get("/watchlist", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      const result = await watcListCollection.find({ email: email }).toArray();
      res.send(result);
    });

  } finally {
    // Ensures that the client will close when you finish/error
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

run().catch(console.dir);
