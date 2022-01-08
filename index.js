// Popular library for server on node
const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

// MongoDB database access setup. 
const mongoDbpassword = process.env.MONGOPASS;
const url = `mongodb+srv://valmi:${mongoDbpassword}@cluster0.y3ezc.mongodb.net/phonebook-app?retryWrites=true&w=majority`;
mongoose.connect(url);

const personSchema = new mongoose.Schema({
  name: String,
  number: Number,
});

// Transform mongoDB results for person json - change id from obj to string, rename id property and delete __version.
personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Person = mongoose.model("Person", personSchema);

// Allow all origin requests to all backend express routes.
app.use(cors());

// Add ability to show static content and js
app.use(express.static("build"));

/**
 * Middleware: Transforms JSON-data in requests to JS objects,
 * so they are accessible in request.body
 *  */
app.use(express.json());

/**
 * Morgan middleware setup:
 * https://github.com/expressjs/morgan
 **/
// app.use(morgan('tiny'))
// Create a new token for returning POST json string
morgan.token("req-body", function (req, res) {
  // console.log('req', req._body);
  if (req._body) {
    return JSON.stringify(req.body);
  }
});
// Use 'tiny' configuration but add json content for post request.
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :req-body"
  )
);

// Node native http server, not so flexible as Express.
// const http = require('http')

let persons = [
  {
    id: 1123124,
    name: "Ada Lovelace",
    number: "1111111111",
  },
  // {
  //   id: 223423,
  //   name: "Bull Mentula",
  //   number: "65434334",
  // },
  // {
  //   id: 34235235,
  //   name: "Jeremy Roenikki",
  //   number: "33333333333",
  // },
];

// Node default http server version of get all endpoint:
//   const app = http.createServer((request, response) => {
//   response.writeHead(200, { 'Content-Type': 'text/plain' })
//   response.end(JSON.stringify(persons))
// })

// app.get("/api/persons", (req, res) => {
//   res.json(persons);
// });

// Get all notes through MongoDB.
app.get("/api/persons", (req, res) => {
  Person.find({}).then((persons) => {
    console.log("persons:", persons);
    res.json(persons)
    mongoose.connection.close();
  });
  
});

app.get("/", (req, res) => {
  res.send("<h1>Heippamaailma</h1>");
});

app.get("/api/persons/:id", (request, response) => {
  //console.log(request.params);

  // Get url parameter via .params.
  const id = Number(request.params.id);

  const person = persons.find((person) => {
    //console.log(person.id, typeof person.id, " ", id, typeof id);
    return person.id === id;
  });

  if (person) {
    response.json(person);
  } else {
    response.status(404).end();
  }
});

app.delete("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  // Backendissä ei tällä hetkellä tietokantaa takana,
  // joten jsonit elävät täällä muuttujissa.
  persons = persons.filter((person) => person.id !== id);

  // Ei täysin standardi, mutta yleensä deletestä palautetaan 204 tai 404.
  response.status(204).end();
});

// Helper function to create a next unique ID in sequence.
const generateId = () => {
  /**
   * To get largest id, we create a new table with all IDs, and
   * then turn it into values for Math.max using ...spread syntax.
   * */
  const maxId =
    persons.length > 0 ? Math.max(...persons.map((person) => person.id)) : 0;
  // Set unique id for new item to add.
  return maxId + 1;
};

// Helper function to create an random ID.
const generateRandomId = () => {
  // Create a long enough random ID so it can work as unique ID.

  const randomId = Number(String(Math.random()).substring(2, 10));
  //console.log(randomId)
  // Set unique id for new item to add.
  return randomId;
};

app.post("/api/persons", (request, response) => {
  const requestBody = request.body;

  // Require necessary fields in post calls.
  if (!requestBody.name || !requestBody.number) {
    return response.status(400).json({
      error: "name or number missing from payload",
    });
  }

  // Do not accept if name already exists
  let isPersonAlreadyInBook = persons.find((person) => {
    return person.name === requestBody.name;
  });
  //console.log('isPersonAlreadyInBook:',  isPersonAlreadyInBook)
  if (isPersonAlreadyInBook) {
    return response.status(400).json({
      error: "name must be unique",
    });
  }

  // If we create object manually like this,
  // we can prevent use of not valid data in json.
  const newPerson = {
    id: generateRandomId(),
    name: requestBody.name,
    number: requestBody.number,
  };

  persons = persons.concat(newPerson);

  // It's often useful in rest api bg debugging to check req headers.
  //console.log("request headers", request.headers);

  // It's good to log enough overall.
  //console.log('New item added:', newPerson);

  response.json(newPerson);
  //console.log('All persons after the post call:', persons)
});

app.get("/info", (request, response) => {
  const currentDate = new Date();
  const amountOfItems = persons.length;
  //console.log('date:', currentDate)

  const htmlResponse = `<p> Phonebook has info for ${amountOfItems} people</p>\
  <p> currentDate: ${currentDate} </p>`;

  response.send(htmlResponse);
});

/**
 * Middleware: we use it after the routes in code,
 * so this only affects those paths that do not have set routes.
 */
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
