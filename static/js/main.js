// empty object template
let fridge = {
  data: [],
  results: 0,
  expired: 0,
  purchasedAfterExpiration: 0,
  raw: {
    types: [],
    stores: [],
  },
};

// query data
let query = {
  load: 50, // load a maximum per page
  page: 1, // load the first page
  type: 'null', // load all types
  search: 'null', // load all searches
  stores: '', // load all stores
  types: '', // load all types
  expired: false, // load non expired food items
  sortby: 'null', // don't sort by anything
  reversed: false, // don't reverse the sorting
  minPurchaseDate: 0, // load all min purchase dates
  maxPurchaseDate: Number.MAX_SAFE_INTEGER, // load all max purchase data
  minExpirationDate: 0, // load all min expiration dates
  maxExpirationDate: Number.MAX_SAFE_INTEGER, // load all max expiration dates
  minQuantity: 0, // load all min quantities
  maxQuantity: Number.MAX_SAFE_INTEGER, // load all max quantities
};

// global vue ref
let vue = {};

/**
 * Updates the query object
 * @param {json} newQuery new query that overwrites current values
 */
function updateQuery(newQuery) {
  query = Object.assign(query, newQuery);
}

/**
 * Updates the filter query and the result data
 * @param {json} newQuery optional query update
 */
function updateData(newQuery) { // eslint-disable-line
  if (newQuery) updateQuery(newQuery);

  // load the default filtered search
  loadData(query).then((data) => {
    vue.fridge.data = data.data;
    vue.fridge.results = data.results;
    vue.fridge.expired = data.expired;
    vue.fridge.purchasedAfterExpiration = data.purchasedAfterExpiration;

    // setup the page selector
    $('#page-selector').pagination({
      items: vue.fridge.results,
      itemsOnPage: query.load,
      currentPage: data.page,
      cssStyle: 'light-theme',
      onPageClick: (page) => {
        updateData({page});
      },
    });
  }).catch((err) => {
    console.error('failed to load filtered data', err);
  });
}

(() => {
  // setup simple vue (this project is too simple to
  // use babel and more ES6 capabilities)
  $(window).ready(() => {
    vue = new Vue({
      el: '#root',
      data: {
        fridge,
      },
      methods: {
        // get the day difference between now and date
        getDaysUntil: (date) => {
          return Math.round((date -
            new Date().getTime()) / (24 * 60 * 60 * 1000));
        },

        // get the available food types
        getFoodTypes: () => {
          const types = [];
          try {
            vue.fridge.raw.types.forEach((v) => {
              if (!types.includes(v.type)) types.push(v.type);
            });
          } catch (err) {}
          return types;
        },

        // format a date into mm/dd/yyyy
        getFormattedDate(date) {
          let month = date.getMonth() + 1;
          let day = date.getDate();

          if (month < 10) month = '0' + month;
          if (day < 10) day = '0' + day;

          return `${month}/${day}/${date.getFullYear()}`;
        },
        updateQuery,
        updateData,
      },
    });

    // preload all of the fridge data
    preload().then((data) => {
      console.log('loaded all of the data [data types]:', data);
      vue.fridge.raw = data;

      // update our base result
      updateData();

      // wait for the dom to populate the filter options
      setTimeout(() => {
        // dynamic filter updating for checkboxes
        $('input[type="checkbox"]').each((_, checkmark) => {
          $(checkmark).on('click', () => {
            let stores = null;
            let types = null;
            let expired = $('input[name="expired"]').is(':checked');

            $('input[type="checkbox"]:checked').each((_, checked) => {
              const value = $(checked).attr('value');
              const name = $(checked).attr('name');

              switch (value) {
                case 'store':
                  if (!stores) stores = [];
                  stores.push(name);
                  break;
                case 'type':
                  if (!types) types = [];
                  types.push(name);
                  break;
              }
            });

            // update the filter query
            // the empty or statements clear the queries
            // if there are no filters selected in that category
            updateData({
              stores: stores || '',
              types: types || '',
              expired,
            });
          });
        });
      }, 500);
    }).catch((err) => {
      console.error('failed to preload all of the data', err);
    });

    // check for the search query change
    $('#search').on('input', () => {
      let text = $('#search').val(); // copy the current value
      // make sure it's a valid entry
      text = ((text || '').length > 0) ? text : 'null';
      updateData({search: text}); // update the search query
    });

    // update the filter accordians
    $('button.filter-title').each((_, button) => {
      $(button).on('click', () => {
        console.log('activating');
        $(button).attr('active', !$(button).attr('active'));
        const group = $(button).next();
        if (group.css('max-height') !== '0px') {
          group.css('max-height', '0px');
          group.css('transform', 'translateY(-2px)');
          group.css('border-top', 'none');
        } else {
          group.css('max-height', group.prop('scrollHeight') + 'px');
          group.css('transform', 'translateY(-2px)');
          group.css('border-top', '2px #B89231 solid');
        }
      });
    });

    // open and close the stats modal
    $('#stats-icon').on('click', () => {
      const stats = $('#stats');
      if (stats.css('display') === 'none') {
        stats.css('display', 'flex');

        loadStats().then((data) => {
          const types = data.types;
          const monthData = [];

          types.forEach((name) => {
            monthData.push({
              type: 'stackedColumn',
              name,
              showInLegend: true,
              dataPoints: [],
            });
          });

          data.monthData.forEach((month) => {
            types.forEach((name, i) => {
              let quantity = 0;
              try {
                quantity = month[name];
              } catch (err) {}
              monthData[i].dataPoints.push({y: quantity, label: month.name});
            });
          });

          $('.year-chart').CanvasJSChart({ // eslint-disable-line
            animationEnabled: true,
            backgroundColor: '#F2F5EA',
            title: {
              text: 'Food Items Purchased By Month',
            },
            axisY: {
              title: 'Quantity',
            },
            toolTip: {
              shared: true,
              reversed: true,
            },
            data: monthData,
          });
        }).catch((err) => {
          console.error('failed to load stats', err);
        });
      } else {
        stats.css('display', 'none');
      }
    });

    // close the modal when the model background is pressed
    $('#stats').on('click', () => {
      $('#stats').css('display', 'none');
    });

    // fix date filters
    const applyDateUpdate = (select, key) => {
      $(select).datepicker().on('change', () => {
        const date = $(select).val();
        updateData({[key]: new Date(date).getTime() || 0});
      }).on('input', () => $(select).change());
    };

    // fix number filters
    const applyNumberUpdate = (select, key) => {
      $(select).on('input', () => {
        updateData({[key]: parseInt($(select).val())});
      });
    };

    // apply the filters to the following object pairs
    const datePairs = [
      ['#min-purchase', 'minPurchaseDate'],
      ['#max-purchase', 'maxPurchaseDate'],
      ['#min-expiration', 'minExpirationDate'],
      ['#max-expiration', 'maxExpirationDate'],
    ];

    const numberPairs = [
      ['#min-quantity', 'minQuantity'],
      ['#max-quantity', 'maxQuantity'],
    ];

    // run through the filter selectors
    datePairs.forEach((pairs) => {
      applyDateUpdate(pairs[0], pairs[1]);
    });

    numberPairs.forEach((pairs) => {
      applyNumberUpdate(pairs[0], pairs[1]);
    });

    // handle the sorting selectors
    $('#sort').on('change', () => {
      updateData({sortby: $('#sort').val()});
    });

    $('#reverse').on('change', () => {
      updateData({reversed: $('#reverse').val() !== 'ascending'});
    });
  });
})();
