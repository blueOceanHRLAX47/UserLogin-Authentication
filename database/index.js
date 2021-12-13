const Sequelize = require('sequelize');
const DataTypes = require('sequelize')

const sequelize = new Sequelize('fbc', 'postgres', 'postgres', {
  host: '10.49.144.4',
  dialect: 'postgres'
});

sequelize.authenticate()
  .then(
    console.log('Success!')
  )
  .catch(err => {
    console.log(err)
  });

sequelize.sync({
  force: false
})

const User = sequelize.define('users', {
  google_id: {
    type: DataTypes.STRING,
  },
  is_coach: {
    type: DataTypes.BOOLEAN,
  },
  coach_id: {
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING,
  },
  profile_photo_url: {
    type: DataTypes.STRING,
  },
  weight: {
    type: DataTypes.INTEGER,
  },
  age: {
    type: DataTypes.INTEGER,
  }
}, {
  timestamp: false,
  createdAt: false,
  updatedAt: false
})

module.exports = {
  sequelize,
  User
};




















