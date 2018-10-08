# BIG FRIDGE
This fridge is tooo big! Help the eater avoid foodborne illness by giving them a better idea of what's inside.

## Requirements
You are provided JSON data (found in `/data` directory and split across 10 files) about the contents of the fridge. The data will contain the following information.

```
[
    {
        "name": "Arugula",
        "type": "Produce",
        "store": "Grocery Outlet",
        "purchaseDate": "2017-03-12T23:46:24.009Z",
        "expirationDate": "2018-05-26T22:55:05.697Z",
        "quantity": 9
    },
    {
        "name": "Yoghurt",
        "type": "Dairy",
        "store": "QFC",
        "purchaseDate": "2017-08-16T05:50:30.187Z",
        "expirationDate": "2018-10-24T02:44:48.130Z",
        "quantity": 5
    },
    ...
]
```

Design and build a UI to display the following metrics.
- Quantity of food by date purchased, bucketed by food name
- Quantity of food purchased after expiration
- List of food items with associated properties

All metrics should be filterable by any of the properties and work in conjunction with other property filters.

Developing the project with [Vue.js](https://vuejs.org/) is preferred.

Backend is not required.

## Deliverables
Please provide the following with your submission.
- A link to the github repo
- A link to a live deployment of the project ([Heroku](https://www.heroku.com/) or elsewhere)

## Duration
This project should take about 24 hours of active work  which can be divided up to fit your schedule.
