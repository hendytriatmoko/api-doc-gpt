const json = require('body-parser');
const modelVpr = require('../model/vprModel');
const fs = require('fs');
const path = require('path');
const moment = require('moment')
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { Document } = require('docx');
const mammoth = require('mammoth');
const bcrypt = require('bcrypt');
const db = require('../database/config');
const { promisify } = require('util');


async function loginUser (req, res) {
    const { username, password } = req.body;

    try{
        // const saltRounds = 10;
        // const hashedPassword = await bcrypt.hash(password, saltRounds);
        const queryAsync = promisify(db.query).bind(db);
        
        // Mendapatkan file_prompt berdasarkan id_file
        const query = 'SELECT * FROM t_user WHERE username = ?';
        const dataget = await queryAsync(query, [username]);
        const result = dataget[0]
        const match = await bcrypt.compare(password, result.password);


        if (result) {
            if (match) {
                
                res.status(200).send({
                    message: 'password benar',
                    nama: username,
                    pass: password,
                    // hashed: hashedPassword,
                    result: result
                });
            }else{
                res.status(400).send({
                    message: 'password salah',
                    nama: username,
                    pass: password
                });
            }
        }else{
            res.status(400).send({
                message: 'user tidak ditemukan',
                error: error.message
            });
        }

    }catch(error){
        res.status(500).send({
            message: 'username atau password salah',
            error: error.message
        });
    }

    // try{
    //     const saltRounds = 10;
    //     const hashedPassword = await bcrypt.hash(password, saltRounds);

    //     const query = 'INSERT INTO t_user (nama, username, password) VALUES (?, ?, ?)';

    //     db.query(query, [nama, username, hashedPassword], (err, result) => {
    //         if (err) {
    //             return res.status(500).json({ error: err.message });
    //         }

    //         res.status(200).json(
    //             { 
    //                 message: 'User added successfully', 
    //                 data: {
    //                     username: username,
    //                     nama: nama
    //                 }
    //             }
    //         );
    //     });

    //     // res.status(200).send({
    //     //     nama: nama,
    //     //     pass: hashedPassword
    //     // });
    // }catch{
    //     res.status(500).send({
    //         message: 'Error in adding user',
    //         error: error.message
    //     });
    // }

}



async function addUser (req, res) {
    console.log('req',req.body)
    const { nama, username, password } = req.body;

    // const query = 'INSERT INTO t_user (nama, password) VALUES (?, ?)';

    // db.query(query, [nama, password], (err, result) => {
    //     if (err) {
    //         return res.status(500).json({ error: err.message });
    //     }

    //     res.status(200).json({ message: 'User added successfully', data: nama });
    // });
    try{

        const queryAsync = promisify(db.query).bind(db);
        const queryusername = 'select username from t_user where username = ?';
        const dataget = await queryAsync(queryusername, [username]);

        if (dataget.length > 0) {
            res.status(400).json(
                { 
                    message: 'Username Sudah Ada',
                }
            );
        }else{
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
        
                const query = 'INSERT INTO t_user (nama, username, password) VALUES (?, ?, ?)';
        
                db.query(query, [nama, username, hashedPassword], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
        
                    res.status(200).json(
                        { 
                            message: 'User added successfully', 
                            data: {
                                username: username,
                                nama: nama
                            }
                        }
                    );
                });

        }



        // res.status(200).send({
        //     nama: nama,
        //     pass: hashedPassword
        // });
    }catch{
        res.status(500).send({
            message: 'Error in adding user',
            error: error.message
        });
    }
}

async function putuser(req,res){
    const { id,nama,password } = req.body

    try{
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const queryAsync = promisify(db.query).bind(db);
        const query = 'update t_user set nama = ?, password = ? where id = ?';
        const dataget = await queryAsync(query, [nama,hashedPassword, id]);
        res.status(200).json(
            { 
                message: 'User successfully updated',
                result: {
                    id: id,
                    nama: nama
                }
            }
        );
    }catch(error){
        res.status(500).send({
            message: 'Error on edit user',
            error: error.message
        });
    }
}

async function getuser(req,res){
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = 'select * from t_user';
        const dataget = await queryAsync(query);
        // const result = dataget

        res.status(200).send({
            message: 'success',
            // hashed: hashedPassword,
            result: dataget
        });

    }catch(error){
        res.status(500).send({
            message: 'Error in get user',
            error: error.message
        });
        
    }
}

module.exports = { 
    addUser,loginUser,getuser,putuser
};