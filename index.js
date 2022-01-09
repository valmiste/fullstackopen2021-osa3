// These are needed for some imports so load them first.
require("dotenv").config();

// Popular library for server on node
const express = require("express");
const app = express();

/**
 * Transforms JSON-data in requests to JS objects,
 * so they are accessible in request.body
 *  */
app.use(express.json());

const cors = require("cors");
const morgan = require("morgan");

// External models for dba access.
const Person = require("./models/person");

// Add ability to show static content and js
app.use(express.static("build"));

// Allow all origin requests to all backend express routes.
app.use(cors());

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

let persons = [
  {
    id: 1123124,
    name: "Ada Lovelace",
    number: "1111111111",
  },
];

// What to output on default path – likely is replaced by front ui build.
app.get("/", (req, res) => {
  res.send("<h1>Hi World</h1>");
});

// Get all notes through MongoDB.
app.get("/api/persons", (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons);
  });
});

app.get("/api/persons/:id", (request, response, next) => {
  // Get url parameter via .params.
  const id = String(request.params.id);

  Person.findById(id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error)); // Send to middleware, more specifically to errorhandler because we use an argument.
});

app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;
  const person = {
    name: body.name,
    number: body.number,
  };

  // findByIdAndUpdate takes normal js object instead of one made via Person constructor, like post/save-usesuses.
  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then((updatedPerson) => {
      // new: true = we get updatedPerson back instead of pre-update one.
      console.log("updatedPerson:", updatedPerson);
      response.json(updatedPerson);
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response, next) => {
  const id = String(request.params.id);

  Person.deleteOne({ _id: id })
    .then((deletionResponse) => {
      console.log("deletionresponse: ", deletionResponse.deletedCount);
      // Not a standard but we should return either 204 or 404 here likely.
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response, next) => {
  const requestBody = request.body;

  // Require necessary fields in post calls.
  if (!requestBody.name || !requestBody.number) {
    return response.status(400).json({
      error: "name or number missing from payload",
    });
  }

  // If we create object manually like this,
  // we can prevent use of not valid data in json.
  const newPerson = new Person({
    name: requestBody.name,
    number: requestBody.number,
  });

  // This is how we send data to mongoDB - and after that send back to frontend.
  newPerson
    .save()
    .then((savedPerson) => { 
      return savedPerson.toJSON(); // We use toJSON-method here via .json()
    })
    .then((savedAndFormattedPerson) => { // Promise chaining.
      return response.json(savedAndFormattedPerson);
    })
    .catch((error) => next(error));
});

app.get("/info", (request, response, next) => {
  const currentDate = new Date();
  let amountOfItems;
  const jees = Person.find({})
    .then((result) => {
      amountOfItems = result.length;
      const htmlResponse = `<p> Phonebook has info for ${amountOfItems} people</p>\
    <p> currentDate: ${currentDate} </p>`;
      response.send(htmlResponse);
    })
    .catch((error) => next(error));
});

// Errorhandler middleware
const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ errorMessage: error.message });
  }

  next(error); // If it's not handled above, send the error to default Express errorhandler
};
// Errorhandler should be after other middleware registrations, except unknown route.
app.use(errorHandler);

/**
 * Middleware: we use it after the routes in code,
 * so this only affects those paths that do not have set routes.
 */
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};
app.use(unknownEndpoint);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
