const CompanyModel = require('../models/company');
const bcrypt = require('bcrypt'); 
const path = require('path');

module.exports = {
    create: async function(req, res, cb) {
        try {
            const existingCompany = await CompanyModel.findOne({email: req.body.email});
            
            if (existingCompany) {
                return res.json({status: "error", message: "Company already exists", data: null});
            }

            const newCompany = await CompanyModel.create({ 
                email: req.body.email, 
                password: req.body.password 
            });

            const createdCompany = await CompanyModel.findOne({email: req.body.email});
            
            return res.json({
                status: "success", 
                message: "Company added successfully!!!", 
                data: {id: createdCompany._id, email: createdCompany.email}
            });
        } catch(e) {
            return res.status(500).json({
                status: "error", 
                message: "Server error: " + e.message, 
                data: null
            });
        }
    },

    authenticate: async function(req, res, cb) {
        try {
            const CompanyInfo = await CompanyModel.findOne({email: req.body.email});
            
            if (!CompanyInfo) {
                return res.json({
                    status: "error", 
                    message: "Invalid email/password!!!", 
                    data: null
                });
            }
            
            if (bcrypt.compareSync(req.body.password, CompanyInfo.password) && CompanyInfo.email == req.body.email) {
                return res.json({
                    status: "success", 
                    message: "company found!!!", 
                    data: {id: CompanyInfo._id, email: CompanyInfo.email}
                });
            } else {
                return res.json({
                    status: "error", 
                    message: "Invalid email/password!!!", 
                    data: null
                });
            }
        } catch(e) {
            return res.status(500).json({
                status: "error", 
                message: "Server error: " + e.message, 
                data: null
            });
        }
    }
}