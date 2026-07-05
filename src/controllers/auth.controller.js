'use strict';

const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.status(200).json({ success: true, ...data });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const data = await authService.refresh(refresh_token);
    res.status(200).json({ success: true, ...data });
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ success: true, ...data });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    await authService.changePassword(req.user.id, current_password, new_password);
    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

module.exports = { login, me, refresh, register, changePassword, updateProfile };
