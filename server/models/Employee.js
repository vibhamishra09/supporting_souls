const mongoose = require("mongoose");
const employeeSchema = new mongoose.Schema({
  username: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
});
const EmployeeModel = mongoose.model("Employees", employeeSchema);
module.exports = EmployeeModel;