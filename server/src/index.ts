
   
import * as r from 'rethinkdb'
import express from 'express'
import multer from 'multer'
import cors from 'cors'
import { join } from 'path'

import { createUUID, getVocab } from './node_app/helpers'
import { ICollection, ICollection_lw, IVocab, IUser, ELanguage } from "./interfaces"
import { ICourse, ICreator } from "interfaces"


const serverAddress:any = 'localhost' // process.env.SERVER_ADDRESS
const serverPort:any = 4000

const dbAddress:any =  'localhost'
const dbPort:any = 28015

var app: express.Express
var upload: multer.Multer
var conn: r.Connection

// for web token
// var jwt = require('express-jwt');






// only because items are stored in DB as string[] and not IVocab[]
interface ICollectionAlt {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly lang: ELanguage;
    readonly author: IUser;
    items: string[] | IVocab[];
}

const fields = [
    {
      name: "image",
      maxCount: 1
    },
    {
      name: "pronunciation",
      maxCount: 1
    }
]

export async function init() {
    app = express()
    upload = multer()

    // SOURCE: Stack overflow...(for resolving the XHTML CORS error.)
    const corsOptions = {
        origin: '*',
        credentials: true,            // access-control-allow-credentials:true
        optionSuccessStatus: 200,
    }
  
    app.use(cors(corsOptions)) // Use this after the variable declaration
    app.use(express.static(join(__dirname, "..", "..", "build")))
    app.use(express.json())

    await setup_rdb(dbAddress, dbPort)

    app.on("ready", () => {
        console.log('app.on.ready')
      
        admin_callbacks()
        vocab_callbacks()
        collection_callbacks()
        user_callbacks()

        //  create function course_callbacks; line 69 call it there; app.get() inside this function
        // hardcode course selection; create endpoint 'getcourses' 
        // 
        
        app.post("/insert_cloud_item", upload.fields(fields), async (req, res) => {
            try {
                let uuidName: string = req.body.value // name of vocab_item
                // multer files...(undefined in interface, will store in its own 'cloud_items' table.)
                const files = req.files as Record<string, Express.Multer.File[]> | undefined;
                const newCloudItem = {
                    // multer attributes...
                    id: await createUUID(uuidName, conn), // CREATE UUID (same as vocab_item)
                    image: {
                        mimetype: files?.image[0].mimetype,
                        buffer: files?.image[0].buffer,
                        originalname: files?.image[0].originalname
                    },
                    image_desc: req.body.imageDesc,
                    pronunciation: {
                        mimetype: files?.pronunciation[0].mimetype,
                        buffer: files?.pronunciation[0].buffer,
                    originalname: files?.pronunciation[0].originalname
                    }
                }
        
                // rdb command
                let result: r.WriteResult
                result = await r.db('a3').table('cloud_items').insert(newCloudItem).run(conn)
                console.log("Successfully inserted cloud_items! Sending cloud item to frontend...", result)
                console.log("newCloudItem HERE: ", newCloudItem); // data shows rdb return attributes, not the new object.
                res.send(newCloudItem) // send back cloud_items to frontend, so it can be added to list for collection.
            
            } catch(err) {
                console.log('insert_cloud_item error!')
                console.log(err)
            }
        })
          
        try {
        app.listen(serverPort, serverAddress, async () => {
          console.log("listening at " + serverAddress + ':' + serverPort)
        })
        } catch(err) {
          console.log('fatal error on app.listen')
          console.log(err)
        }
      }) 
      

    return {
        'node': app,
        'multer': upload,
        'connection': conn
    }
}

async function setup_rdb(dbAddress: string, dbPort: number) {
    r.connect({ host: dbAddress, port: dbPort }, (err, connection) => {
        if (err) {
            console.log(err)
            throw err
        } else {
            conn = connection
            console.log("connected to rethinkDB!")
            app.emit("ready")
        }
    })
}


var jwt = require('jsonwebtoken');
var tokens = jwt.sign({ foo: 'RobertBlake' }, '1234456');
const secret_key ="This is so secret";
const secret_key_creator="Creator Secret Key";
function user_callbacks() {
    app.get('/verifyUser', async (req, res) => {
        // TODO verify user data
        res.send(true)
    });
    app.get('/getUsertoken', async (req, res) => {
        res.send(tokens) // got the token. 
    });
    app.get('/instructorauth', async (req, res) => {
        const jsontoken =jwt.sign({ foo: 'RobertBlake' }, secret_key);
        
        const data = { token: jsontoken };
        res.send(data) // got the token. 
    });
    app.get('/creatorauth', async (req, res) => {
        const jsontoken =jwt.sign({ foo: 'Ronvic Cuevas' }, secret_key_creator);
        const data = { token: jsontoken };
        res.send(data) // got the token. 
    });

}


function admin_callbacks() {
    app.get('/status', async(req, res) => {
        console.log('reachable')
        res.send('reachable')
    })

    app.get("/initDB", async (req, res) => {
        try {
          r.dbList().run(conn, (err, data) => {
            if(err) {
              console.log(err)
            } else {
              if(!data.includes('a3')) {
                r.dbCreate('a3').run(conn, (err, result) => {
                  if(err) {
                    console.log(err)
                  } else {
                    console.log(result)
                  }
                })
                console.log('Created database "a3"!')
              } else {
                console.log('database "a3" exists!')
              }
            }
          })
        }
        catch (err) {
          console.log('There was an error on db initialization')
          console.log(err)
        }

        try {
            r.dbList().run(conn, (err, data) => {
                console.log('current databases in rdb')
                console.log(data)
            })
          
            r.db('a3').tableCreate('collections').run(conn, (err, data) => {
                if (err) {
                  console.log("Failed to create a3.collections")
                } else {
                  console.log("Successfully created collections table!")
                }
            });
            
            r.db('a3').tableCreate('vocab_items').run(conn, (err, data) => {
                if (err) {
                  console.log("Failed to create a3.vocab_items")
                } else {
                  console.log("Successfully created vocab_items table!")
                }
            });
            
            r.db('a3').tableCreate('cloud_items').run(conn, (err, data) => {
                if (err) {
                  console.log("Failed to create a3.cloud_items")
                } else {
                  console.log("Successfully created cloud_items table!")
                }
            });
        } catch (err) {

        }
    })

    // helper API calls, delete both tables & create them manually when needed to initialize again (for testing!)
    // copy and paste the shortcut links to use them...
    // SHORTCUT LINK; 
    // http://localhost:4000/deleteALL
    app.get("/deleteALL", async (req, res) => {
        r.db('a3').tableDrop('collections').run(conn, (err, data) => {
            if (err) {
            console.log("Failed...")
            } else {
            console.log("Successfully deleted collections table!")
            }
        });
        r.db('a3').tableDrop('vocab_items').run(conn, (err, data) => {
            if (err) {
            console.log("Failed...")
            } else {
            console.log("Successfully deleted vocab_items table!")
            }
        });
        r.db('a3').tableDrop('cloud_items').run(conn, (err, data) => {
            if (err) {
            console.log("Failed...")
            } else {
            console.log("Successfully deleted cloud_items table!")
            }
        });

        res.send('tables have been deleted')
    })

}

function vocab_callbacks() {
    // [POST] New VocabItem
    app.post("/insert_vocab_item", async (req, res) => {
        // This data matches IVocab interface...
        console.log(req.body)
        let uuidName: string = req.body.value // name of vocab_item
        
        const newVocabItem: IVocab = {
            id: await createUUID(uuidName, conn), // CREATE UUID
            lang: req.body.lang,
            translation: req.body.translation,
            value: req.body.value,
            s3Key: req.body.s3Key
        }

        // rdb command
        let result: r.WriteResult
        try {
            result = await r.db('a3').table('vocab_items').insert(newVocabItem).run(conn)
            console.log("Successfully inserted vocab_item! Sending vocab item to frontend...", result)
            console.log("newVocabItem HERE: ", newVocabItem); // data shows rdb return attributes, not the new object.
            res.send(newVocabItem) // send back vocab_item to frontend, so it can be added to list for collection.
        } catch (err) {
            console.log("Failed...", err)
        }

        // r.db('a3').table('vocab_items').insert(newVocabItem).run(connection, (err, data) => {
        //   if (err) {
        //     console.log("Failed...")
        //     throw err;
        //   } else {
        //     console.log("Successfully inserted vocab_item! Sending vocab item to frontend...", data)
        //     console.log("newVocabItem HERE: ", newVocabItem); // data shows rdb return attributes, not the new object.
        //     res.send(newVocabItem) // send back vocab_item to frontend, so it can be added to list for collection.
        //   }
        // });
    })

    // [GET] Get Specific VocabItem
    app.get("/get_vocab_item/:uuid", async (req, res) => {
        let { uuid } = req.params
        console.log(uuid)
        let result: IVocab
    
        try {
            result = await getVocab(uuid, conn)
            console.log("Successfully got collection item!", result)
            console.log("Sending to frontend...")
            res.send(result)
        } catch (err) {
            console.log("Failed /get_vocab_item", err)
            res.send("failed to get vocab item!")
        }
    
        // OLD
        // r.db('a3').table('vocab_items').get(uuid).run(connection, (err, data) => {
        //   if (err) {
        //     console.log("Failed...")
        //     throw err
        //   } else {
        //     console.log("Successfully got collection item!", data)
        //     console.log("Sending to frontend...")
        //     res.send(data)
        //   }
        // })
    })
}

function collection_callbacks() {
    // [POST] New Collection
    app.post("/insert_collection", async (req, res) => {
        let items: IVocab[] = req.body.items
        let vi_items_list = items.map(item => item.id)
        console.log(vi_items_list)
        let uuidName: string = req.body.name // name of collection
        const newCollectionItem: ICollectionAlt = {
            id: await createUUID(uuidName, conn), // CREATE UUID
            author: req.body.author,
            description: req.body.description,
            items: vi_items_list, // vocab_items list for this collection
            lang: req.body.lang,
            name: req.body.name
        }


        
    
        // rdb command
        let result: r.WriteResult
        try {
            result = await r.db('a3').table('collections').insert(newCollectionItem).run(conn)
            console.log("Successfully inserted collections item!", result)
            res.send("Success!")
        } catch (err) {
            console.log("Failed /insert_collection", err)
        }
    
        // OLD
        // r.db('a3').table('collections').insert(newCollectionItem).run(connection, (err, data) => {
        //   if (err) {
        //     console.log("Failed...")
        //     throw err;
        //   } else {
        //     console.log("Successfully inserted collections item!", data)
        //     res.send("Success!");
        //   }
        // });
    })

    const sample: ICollection = {
        author: {
          email: {
            address: "alec@null.net"
          },
          id: "",
          name: "Alec Atienza",
          rank: 0
        },
        description: "a collection of Spanish vocab",
        id: "random",
        lang: 0,
        name: "Spanish collection",
        items: [
          {
            id: "a1",
            lang: 1,
            translation: "cat",
            value: "el gato"
          },
          {
            id: "a2",
            lang: 1,
            translation: "dog",
            value: "el perro"
          }
        ]
      }

      const sample2: ICollection = {
        author: {
          email: {
            address: "alec@null.net"
          },
          id: "",
          name: "Alec Atienza",
          rank: 0
        },
        description: "a collection of Spanish vocab",
        id: "random2",
        lang: 0,
        name: "Spanish collection 2",
        items: [
          {
            id: "b1",
            lang: 1,
            translation: "table",
            value: "la mesa"
          },
          {
            id: "b2",
            lang: 1,
            translation: "pencil",
            value: "el lápiz"
          }
        ]
      }

      const coursesample: ICourse = {
        name: "Spanish",
        catalog: "1-Intro to Spanish A01",
        collections: [sample],
        id: "123456789",
        creator:
        {
            collections: [sample],
            name: "test",
            email: {
                address: "test@email.com"
            },
            rank: 0,
            id: "123456789"
        }
    }

    const coursesample2: ICourse = {
        name: "Spanish",
        catalog: "1-Intro to Spanish A02",
        collections: [sample2],
        id: "987654312",
        creator:
        {
            collections: [sample2],
            name: "test2",
            email: {
                address: "test2@email.com"
            },
            rank: 0,
            id: "987654312"
        }
    }


    app.get("/instructorview", async (req, res) => {
        res.send(coursesample)
        res.send(coursesample2)

    })

    const collectionArray = [sample, sample2];

    app.put("/submitCourse", async (req,res) =>{
        console.log("The server has recieved a put request from the web client");
        console.log(req.body);
        res.send("boop!"); //just send something back to client
    });

    app.get("/getCollections", async (req,res) =>{
        console.log("The server has recieved a get request from the web client");
        res.send(collectionArray); //just send something back to client
    })

    // [UPDATE] Existing Collection or Vocab_Item
    app.put("/update/:tableName/:uuid", async (req, res) => {
        // query for the correct element row by UUID, then update.
        let { uuid } = req.params // UUID identifier...
        let { tableName } = req.params  // "collections" or "vocab_items"
        // For attribute: send in params like {"value": "newVal", "lang": "newlang"} comma-spaced k,v pair.
        // SOURCE: https://rethinkdb.com/api/javascript/update
        // console.log(req.body)
        let attribute: Record<string, unknown>
        if (tableName === "collections") {
            let items = req.body.items as IVocab[]
            attribute = { items: items.map(item => item.id) }// get all attributes from request
        }
        if (tableName === "vocab_items") {
            attribute = req.body
        }
        // rdb command
        let result: r.WriteResult
        try {
            result = await r.db('a3').table(tableName).get(uuid).update(attribute!).run(conn)
            console.log(result)
            res.send({
            message: "Success!",
            id: uuid
            })
        } catch (err) {
            console.log("update failed:", err)
            res.send("failed to update item/collection")
        }
    
        // OLD
        // r.db('a3').table(tableName).get(uuid).update(attribute).run(connection, (err, data) => {
        //   if (err) {
        //     console.log("Failed...")
        //     throw err
        //   } else {
        //     console.log("Successfully updated item!", data)
        //     res.send("Success!")
        //   }
        // })
    })
    
    // [DELETE] Existing Collection or Vocab_Item
    app.delete("/delete/:tableName/:uuid", async (req, res) => {
    // query for the correct element row by UUID, then delete.
    let { uuid } = req.params // UUID identifier...
    let { tableName } = req.params // "collections" or "vocab_items"

    // rdb command
    let result: r.WriteResult
    try {
        result = await r.db('a3').table(tableName).get(uuid).delete().run(conn)
        console.log("Successfully deleted item!", result)
        res.send(result)
    } catch (err) {
        console.log("Failed...")
        res.send("failed to delete!")
    }
    // r.db('a3').table(tableName).get(uuid).delete().run(connection, (err, data) => {
    //   if (err) {
    //     console.log("Failed...")
    //     throw err
    //   } else {
    //     console.log("Successfully deleted item!", data)
    //     res.send(data)
    //   }
    // })
    })
    
    // [GET] Get All Collections
    app.get("/get_all_collections", async (req, res) => {
      console.log("IN GET ALL COLL")
      // rdb command
      const p = await r.db('a3').table('collections').run(conn) // get all collection entries
      // console.log(p)
      const results: any = await p.toArray()
      console.log(results)
      for (const col of results) {
          const fullItems: IVocab[] = await Promise.all(col.items.map(async (id: string) => {
            // console.log({ id })
            const result = await getVocab(id as string, conn)
            return result
          }))
          col.items = fullItems
      }

      // OLD
      // const fullVocab = await Promise.all(results.items)
      // const data = await p.then(async (curs: r.Cursor) => {
      //   console.log("here1")
      //   const results = await curs.toArray()
      //   console.log("here2")
      //   return results
      // })
      console.log("Successfully got all collections!", results)
      res.send(results as IVocab[]) // return them in a 'nicer' array format.
    })
    
    // [GET] Get Specific Collection
    app.get("/get_collection/:uuid", async (req, res) => {
    const { uuid } = req.params
    let result: any

    try {
        result = await r.db('a3').table('collections').get(uuid).run(conn)
        if (!result) throw new Error("could not get collection!")
        result.items.map(async (id: string) => {
        const result = await getVocab(id, conn)
        return result
        })
    } catch (err) {
        console.log(err)
        res.send("failed to get collection")
    }

    // OLD
    // r.db('a3').table('collections').get(uuid).run(connection, (err, data) => {
    //   if (err) {
    //     console.log("Failed...")
    //     throw err
    //   } else {
    //     console.log("Successfully got collection item!", data)
    //     console.log("Sending to frontend...")
    //     res.send(data)
    //   }
    // })
    })

}


const node = init().then(

)
