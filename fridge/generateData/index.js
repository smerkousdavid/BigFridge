'use strict';
const N_JSONS = 10;
const N_ITEMS_PER_JSON = 5000;

const fs = require('fs');
const foodTypes = require(__dirname + '/rawData/foodTypes');
const stores = require(__dirname + '/rawData/stores');


const generators = {
    store() {
        return _randEl(stores);
    },
    foodAndType() {
        return _randEl(foodTypes);
    },
    purchaseDate() {
        return _randDate(new Date(2015, 0, 1), new Date());
    },
    expirationDate() {
        return _randDate(new Date(2017, 0, 1), new Date(2020, 0, 1));
    },
    quantity() {
        return Math.ceil(Math.random() * 10)
    },
}


function generate() {

    for (let i = 0; i < N_JSONS; i++) {

        let outputArr = [];
        for (let i = 0; i < N_ITEMS_PER_JSON; i++) {
            let foodAndType = generators.foodAndType();
            outputArr.push(
                {
                    name: foodAndType.name,
                    type: foodAndType.type,
                    store: generators.store(),
                    purchaseDate: generators.purchaseDate(),
                    expirationDate: generators.expirationDate(),
                    quantity: generators.quantity(),
                }
            );
        }

        _writeFile(i, outputArr);
    }
}

generate();



function _randEl(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function _randDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function _writeFile(i, data) {
    let filename = `data-${i}.json`;
    fs.writeFile(`./data/${filename}`, JSON.stringify(data, null, 4), (err) => {
        if (err) console.log('Error writing ' + filename, err);
        else console.log('Successfully wrote ' + filename);
    })
}
