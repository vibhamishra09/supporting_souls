const express = require("express");

const mongoose = require("mongoose");
const cors = require("cors");
const EmployeeModel = require("./models/Employee");
const app = express();
app.use(express.json());
app.use(cors());
const port = 5000;

mongoose.connect("mongodb://127.0.0.1:27017/employee", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.log(err);
});
app.post("/login", (req, res) => {
    const {email, password} = req.body;
    EmployeeModel.findOne({email: email}).then((username) => {
        if(username) {
            if(username.password === password) {
                res.json("Success");
            } else {
                res.json("Failed");
            }
        } else {
            res.json("no record found");
        }
    });
}); 
app.post("/register", (req, res) => {
    EmployeeModel.create(req.body).then((employees) => {
        res.json({message: "Employee registered successfully"});
    }).catch((err) => {
        res.json({message: "Employee not registered"});
    });
   
 
});
app.listen(3001, () => {
  console.log(`Server is running on port ${port}`);
});