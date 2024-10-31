const json = require('body-parser');
const modelVpr = require('../model/vprModel');
const fs = require('fs');
const path = require('path');
const moment = require('moment')
require('dotenv').config();
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { Document } = require('docx');
const mammoth = require('mammoth');
const db = require('../database/config');
// Import OpenAI library
const OpenAI = require('openai');
const { promisify } = require('util');
const axios = require('axios');


async function postuniversitas(req,res) {
    const { nama } = req.body;
    try{
        const query = 'INSERT INTO t_universitas (nama) VALUES (?)';
        
        db.query(query, [nama], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(200).json(
                { 
                    message: 'University added successfully', 
                    data: {
                        nama: nama
                    }
                }
            );
        });

    }catch(error){
        res.status(500).send({
            message: 'Error in adding university',
            error: error.message
        });
    }
}

async function getuniversitas(req,res) {
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = 'select * from t_universitas order by nama asc';
        const dataget = await queryAsync(query);
        // const result = dataget

        res.status(200).send({
            message: 'success',
            // hashed: hashedPassword,
            result: dataget
        });
    }catch(error){
        res.status(500).send({
            message: 'Error in get university',
            error: error.message
        });
    }
}

async function putuniversitas(req,res) {
    const { id,nama } = req.body;
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = 'update t_universitas set nama = ? where id = ?';
        await queryAsync(query, [nama, id]);
        res.status(200).json(
            { 
                message: 'University successfully updated',
                result: {
                    id: id,
                    nama: nama
                }
            }
        );
    }catch(error){
        res.status(500).send({
            message: 'Error in update university',
            error: error.message
        });
    }
}

async function deleteuniversitas(req,res) {
    const { id } = req.body;
    try{
        const queryAsync = promisify(db.query).bind(db);
        const query = 'delete from t_universitas where id = ?';
        await queryAsync(query, [id]);
        res.status(200).json(
            { 
                message: 'University successfully deleted',
                result: {
                    id: id
                }
            }
        );
    }catch(error){
        res.status(500).send({
            message: 'Error in delete university',
            error: error.message
        });
    }
}


module.exports = { 
    postuniversitas,getuniversitas,putuniversitas,deleteuniversitas
};