const mongoose = require("mongoose");

if (process.argv.length < 3) {
  console.log("give password as argument");
  process.exit(1);
}

// Get third argument from CLI
const password = process.argv[2];

const url = `mongodb+srv://valmi:${password}@cluster0.y3ezc.mongodb.net/phonebook-app?retryWrites=true&w=majority`;
// `mongodb+srv://fullstack:${password}@cluster0-ostce.mongodb.net/test?retryWrites=true`
// mongodb+srv://valmi:<password>@cluster0.y3ezc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

mongoose.connect(url);

const personSchema = new mongoose.Schema({
  name: String,
  number: Number,
});
const Person = mongoose.model("Person", personSchema);

const nameToAdd = process.argv[3];
const numberToAdd = process.argv[4];
if (nameToAdd && numberToAdd) {
  const person = new Person({
    name: nameToAdd,
    number: numberToAdd
  });
  // Add new phonebook entry.
  person.save().then((result) => {
      console.log(`added ${result.name} number ${result.number} to phonebook` )
    // console.log("person saved!", result);
    mongoose.connection.close();
  });
} else {
    // Get all phonebook entries.
    // Model method find gets all entries, if you give it empty object for matching.
    Person.find({}).then((result) => {
    console.log('phonebook:');
    result.forEach((person) => {
      console.log(`${person.name} ${person.number}`)
    });
    mongoose.connection.close();
  });
}


