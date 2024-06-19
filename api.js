const express = require('express');
const {Sequelize,DataTypes} = require('sequelize');
const bcrypt = require('bcrypt');
const { INTEGER } = require('sequelize');
const { TEXT } = require('sequelize')

const app = express();
app.use(express.json());

app.get('/hello',(req, res) =>{
    res.send('Hello world!')
});
const port = process.env.port ||5000;
app.listen(port,() => {
    console.log(`Server is running on port ${port}`);
});
//Mysql connection connection
const sequelize = new Sequelize('studentmanagment','root','',{
   host: 'localhost',
   dialect: 'mysql' 
});
sequelize.authenticate()
     .then(() => console.log("Connection successful"))
     .catch(error => console.log ("Connection failed", error));


//student  details
const Student = sequelize.define('Student',{
    id: {type: INTEGER, primaryKey:true, autoIncrement: true},
    firstname: {type: TEXT, allowNull: false},
    secondname: {type: TEXT, allowNull: false},
    email: {type: TEXT, allowNull: false, unique: true},
    phoneno: {type: INTEGER, allowNull: false},
    username: {type: TEXT, allowNull: false, unique: true},
    studyyear: {type: INTEGER, allowNull: false},
    password: {type: TEXT, allowNull:  false}
}, {timestamps: false});

sequelize.sync()
    .then(() => console.log("Model synced with database"))
    .catch(error => console.log ("Sync failed", error)); 
//student model
app.post('/student/register', async (req, res) =>{
    const {firstname, secondname,email,phoneno,username,studyyear, password} = req.body;
    
    if (!firstname || !secondname || !email || !phoneno || !username || !studyyear || !password) {
        return res.status(400).send("All fields are required");
    }
    
    const CheckUsedUEmail = await Student.findOne({where: {email}});
        if ( CheckUsedUEmail){
            return res.status(400).send("Email is taken")
        }

    const CheckUsedUsername = await Student.findOne({where: {username}});
        if ( CheckUsedUsername){
            return res.status(400).send("Username is taken")
        }       
    
    const hashedPassword = await bcrypt.hash(password, 10);   
    const student  = new Student({
        firstname,
        secondname,
        email,
        phoneno,
        username,
        studyyear,
        password: hashedPassword 

    });
   
    try{
        student.save().then(
           ()=> {
            res.status(201).json({message: 'Student registered succesfully!'});
    })
       

    }catch (error){
        console.log("Error, during registration try again later.")
        res.status(500).send("Error during registration");
    }
});

// student/login
app.get('/student/login', async(req, res) => {
    const { username, password } = req.body;
if (!username|| !password){
    return res.status(400).send({error: "Username and password are required"})
}
try{
    const student = await Student.findOne({where: {username}});
    if (!student){
        return res.status(404).send({error: "Invalid User"});
    }
    const isPasswordValid = await bcrypt.compare( password, student.password);
    if (!isPasswordValid){
        return res.status(400).send({error: "Wrong Password"});
    }
    
    res.status(200).send(student);
    console.log("logged in successfuly");
} catch (error) {
    res.status(401).send(error)
    }
});


//using the constant Student Which is connected to mysql
app.put('/student/dashboard/changepassword', async (req, res) =>{
    const {username, password,newpassword} = req.body;
    
    try {
        const student = await Student.findOne({where: {username}});
        if(!student){
            return res.status(404).send("student not found");
        }
        
        const isPasswordValid = await bcrypt.compare(password, student.password);
        if (!isPasswordValid) {
            return res.status(400).send("Wrong Passcode");
        }
        const diffrentpass = await bcrypt.compare(newpassword, student.password);
        if (diffrentpass){
            return res.status(200).send("Enter a diffrent password from the current.")
        }else{Student.password = await bcrypt.hash(newpassword, 10);
            await student.save();
                res.status(200).send("Password changed successfully");
        };    
    } catch (error) {
        console.error("Error occured while changing password")
        res.status(400).send(error);
    }
    
});
// forgote password path
app.get('/student/forgotpassword/', async (req, res) =>{
   const {email, phoneno} = req.body;

   try{
    const student = await Student.findOne({where: {email,phoneno}});
    if (!student){
        return res.status(404).send("Invalid email or phone number");
    }

   } catch (error){
    res.status(500).send("Error during password. Try again later")
   }

});

app.get('/student/allstudents', async(req, res) =>{
    const allstudents = await Student.findAll();
    if (allstudents){
        res.status(200).send(allstudents);
    }else{
        res.status(400).send("Error fetching students")
    }
})
