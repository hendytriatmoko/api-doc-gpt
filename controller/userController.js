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

module.exports = { 
    addUser
};