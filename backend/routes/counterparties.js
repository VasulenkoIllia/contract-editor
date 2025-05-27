const express = require('express');
const router = express.Router();
const { Sequelize, Op } = require('sequelize');
const Counterparty = require('../models/Counterparty');

// POST /api/counterparties - Save a new counterparty
router.post('/', async (req, res) => {
  try {
    const {
      genericName,
      signatureName,
      company,
      director,
      documentName,
      address,
      postAddress,
      phone,
      email,
      bankAccount,
      bank,
      bankCode,
      code,
      individualCode
    } = req.body;

    if (!company) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Check if counterparty with this company name already exists
    const existingCounterparty = await Counterparty.findOne({
      where: { company: company }
    });

    if (existingCounterparty) {
      // Update existing counterparty
      await existingCounterparty.update({
        genericName,
        signatureName,
        company,
        director,
        documentName,
        address,
        postAddress,
        phone,
        email,
        bankAccount,
        bank,
        bankCode,
        code,
        individualCode
      });

      return res.status(200).json({
        message: 'Counterparty updated successfully',
        counterparty: existingCounterparty
      });
    }

    // Create new counterparty
    const counterparty = await Counterparty.create({
      genericName,
      signatureName,
      company,
      director,
      documentName,
      address,
      postAddress,
      phone,
      email,
      bankAccount,
      bank,
      bankCode,
      code,
      individualCode
    });

    res.status(201).json({
      message: 'Counterparty saved successfully',
      counterparty
    });
  } catch (error) {
    console.error('Error saving counterparty:', error);
    res.status(500).json({ message: 'Failed to save counterparty' });
  }
});

// GET /api/counterparties - Get all counterparties
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let whereClause = {};

    if (search) {
      // Filter counterparties by company only (case-insensitive)
      whereClause = {
        company: {
          [Op.iLike]: `%${search}%`
        }
      };
    }

    const counterparties = await Counterparty.findAll({
      where: whereClause,
      order: [['company', 'ASC']]
    });

    res.json(counterparties);
  } catch (error) {
    console.error('Error getting counterparties:', error);
    res.status(500).json({ message: 'Failed to get counterparties' });
  }
});

// GET /api/counterparties/:id - Get a specific counterparty
router.get('/:id', async (req, res) => {
  try {
    const counterparty = await Counterparty.findByPk(req.params.id);

    if (!counterparty) {
      return res.status(404).json({ message: 'Counterparty not found' });
    }

    res.json(counterparty);
  } catch (error) {
    console.error('Error getting counterparty:', error);
    res.status(500).json({ message: 'Failed to get counterparty' });
  }
});

// DELETE /api/counterparties/:id - Delete a counterparty
router.delete('/:id', async (req, res) => {
  try {
    const counterparty = await Counterparty.findByPk(req.params.id);

    if (!counterparty) {
      return res.status(404).json({ message: 'Counterparty not found' });
    }

    // Delete from the database
    await counterparty.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting counterparty:', error);
    res.status(500).json({ message: 'Failed to delete counterparty' });
  }
});

module.exports = router;
