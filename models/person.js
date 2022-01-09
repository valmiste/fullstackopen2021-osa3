const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

// MongoDB database access setup.
const mongoDbpassword = process.env.MONGOPASS
const url = `mongodb+srv://valmi:${mongoDbpassword}@cluster0.y3ezc.mongodb.net/phonebook-app?retryWrites=true&w=majority`
console.log('connectiong to ', url)

mongoose
  .connect(url)
  .then(() => {
    console.log('connected to MongoDB:')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  // name: String,
  // number: Number,

  // Let's use validation rules for Mongoose
  name: {
    type: String,
    minlength: 3,
    required: true,
    unique: true
  },
  number: {
    type: String,
    minlength: 8,
    required: true
  }
})

// Add unique validator plugin to schema
personSchema.plugin(uniqueValidator)

// Transform mongoDB results for person json - change id from obj to string, rename id property and delete __version.
personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

const Person = mongoose.model('Person', personSchema)

// CommonJS module export for Person instance.
module.exports = Person


