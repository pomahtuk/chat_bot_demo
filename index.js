const Wit = require("node-wit").Wit

const token = (() => {
  if (process.argv.length !== 3) {
    console.log("usage: node index.js <wit-token>")
    process.exit(1)
  }
  return process.argv[2]
})()

const lastEntityValue = (entities, entity) => {

  let entityVal = entities && entities[entity]

  if (entityVal) {
    let val = Array.isArray(entityVal) &&
      entityVal.length > 0 &&
      entityVal[entityVal.length - 1].value

    if (val) {
      return typeof val === "object" ? val.value : val
    }
  }

  return null
}

const actions = {
  say: (sessionId, msg, cb) => {
    //console.log(msg);
    cb()
  },

  merge: (context, entities, cb) => {
    delete context.response

    const location = lastEntityValue(entities, "location")
    const intent = lastEntityValue(entities, "intent")

    // what should be done if location not recognised?

    if (location) {
      context.location = location
    }

    if (intent) {
      context.intent = intent
    }

    cb(context)
  },

  error: (sessionId, msg) => {
    console.log("Oops, I don\"t know what to do.", msg)
  },

  fetchObjectsByLocation: (context, cb) => {
    console.log("debug object fetcher", context.intent)
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.location)
    switch (context.intent) {
    case "tours":
      context.response = "2 hour tour, 20 POI tour, Super nice tour"
      break
    case "museums":
      context.response = "Super cool museum, other extra cool museum and some shitty one"
      break
    default:
      console.log("nope")
    }
    cb(context)
  }
}

const client = new Wit(token, actions)
client.interactive()
