import React, { useState, useEffect } from 'react';
import moment from 'moment';
import Airtable from 'airtable';
const base = new Airtable({ apiKey: 'keyCxnlep0bgotSrX' }).base('appHXXoVD1tn9QATh');

import Header from './header';
import Footer from './footer';
import Modal from './modal';

function clientsReducer(state, action) {
  return [...state, ...action];
}

/* globals $ */
function App() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [activities, setActivities] = useState([]);

  const [clients, dispatch] = React.useReducer(
    clientsReducer,
    [] // initial clients
  );

  // When app first mounts, fetch clients
  useEffect(() => {

    base('Clients').select().eachPage((records, fetchNextPage) => {
      dispatch(records);

      fetchNextPage();
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

  }, []); // Pass empty array to only run once on mount

  function massUpload() {
    // Open the modal
    $('#uploadModal').modal();

    $('#counter').html(`<p><span id="finishedUploads">0</span> / ${clients.length}</p>`);

    // Upload to all clients
    clients.map(client => {
      uploadChallenge(client);
    });
  }

  function uploadChallenge(client) {
    // Open the modal
    $('#uploadModal').modal();

    const startDate = '2020-03-09';
    const endDate = '2020-03-31';

    const data = {
      'AboutChallenge': '',
      'ActivityReward': {
        'Type': 'IncentivePoints',
        'Value': '0'
      },
      'ActivityType': 'complete the Hot Topics podcast',
      'AmountUnit': '',
      'ChallengeLogoThumbURL': 'https://images.limeade.com/PDW/46d4129e-5222-43b2-ac78-696f69b42410-large.jpg',
      'ChallengeLogoURL': 'https://images.limeade.com/PDW/46d4129e-5222-43b2-ac78-696f69b42410-large.jpg',
      'ChallengeTarget': 1,
      'ChallengeType': 'OneTimeEvent',
      'Dimensions': [],
      'DisplayInProgram': startDate === moment().format('YYYY-MM-DD') ? true : false,  // sets true if the challenge starts today
      'DisplayPriority': null,
      'EndDate': endDate,
      'EventCode': '',
      'Frequency': 'None',
      'IsDeviceEnabled': false,
      'IsFeatured': null,
      'IsSelfReportEnabled': true,
      'IsTeamChallenge': false,
      'Name': 'Special Edition Hot Topic - COVID-19: Managing Your Mindset',
      'ShortDescription': 'No matter where you are today, you can always discover opportunities to grow and unlock your potential.',
      'ShowExtendedDescription': false,
      'ShowWeeklyCalendar': false,
      'StartDate': startDate,
      'TeamSize': null
    };

    $.ajax({
      url: 'https://api.limeade.com/api/admin/activity',
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify(data),
      headers: {
        Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
      },
      contentType: 'application/json; charset=utf-8'
    }).done((result) => {
      const surveyUrl = `/api/Redirect?url=https%3A%2F%2Fheartbeat.adurolife.com%2Fapp%2Fsurvey%2F%3Fs%3Dcc15e309-c5f9-42bf-9efa-fd9f43e7fcfa%26q1%3D${result.Data.ChallengeId}%26q4%3D%5Bparticipantcode%5D%26q5%3D%5Be%5D`;

      $.ajax({
        url: 'https://api.limeade.com/api/admin/activity/' + result.Data.ChallengeId,
        type: 'PUT',
        dataType: 'json',
        data: JSON.stringify({
          'AboutChallenge': `<p>The uncertainty and quickly changing situation with COVID-19 can lead to fear and anxiety. But &ndash; is that helping or hurting us? For many of us, it&rsquo;s also adding to a lingering background stress that can accumulate, and have a real impact on our ability to function. So, why does this happen, and what can we do to ease it in our day to day lives? Licensed Integrative Psychotherapist Joe Eiben answers our questions on this edition of Hot Topics.</p><p><a href="https://vimeo.com/adurolife/review/395790817/0b14605edf" target="_blank" rel="noopener">Listen to the episode here</a>.</p><p><a href="${surveyUrl}" target="_blank" rel="noopener">After the podcast, be sure to fill out the survey</a>. We'd love to hear from you!</p><p style="font-size: 0.7em;">&copy; Copyright 2020 <a style="text-decoration: none;" href="http://www.adurolife.com/" target="_blank" rel="noopener">ADURO, INC.</a> All rights reserved.</p>`
        }),
        headers: {
          Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
        },
        contentType: 'application/json; charset=utf-8'
      }).done((result) => {

        // Advance the counter
        let count = Number($('#finishedUploads').html());
        $('#finishedUploads').html(count + 1);

        $('#uploadModal .modal-body').append(`
          <div class="alert alert-success" role="alert">
            <p>Uploaded Tile for <strong>${client.fields['Account Name']}</strong></p>
            <p class="mb-0"><strong>Challenge Id</strong></p>
            <p>${result.Data.ChallengeId}</p>
            <p class="mb-0"><strong>Survey link</strong></p>
            <p>${surveyUrl}</p>
          </div>
        `);

      }).fail((request, status, error) => {
        console.error(request.status);
        console.error(request.responseText);
        console.log('Update challenge failed for client', client.fields['Limeade e=']);
      });

    }).fail((request, status, error) => {
      console.error(request.status);
      console.error(request.responseText);
      console.log('Create challenge failed for client ' + client.fields['Limeade e=']);
    });

  }

  function selectClient(e) {
    clients.forEach((client) => {
      if (client.fields['Limeade e='] === e.target.value) {
        setSelectedClient(client);
      }
    });
  }

  function renderEmployerNames() {
    const sortedClients = [...clients];

    sortedClients.sort((a, b) => {
      const nameA = a.fields['Limeade e='].toLowerCase();
      const nameB = b.fields['Limeade e='].toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    return sortedClients.map((client) => {
      return <option key={client.id}>{client.fields['Limeade e=']}</option>;
    });
  }

  return (
    <div id="app">
      <Header />

      <div className="form-group">
        <label htmlFor="employerName">EmployerName</label>
        <select id="employerName" className="form-control custom-select" onChange={selectClient}>
          <option defaultValue>Select Employer</option>
          {renderEmployerNames()}
        </select>
      </div>

      <div className="text-center">
        <button type="button" className="btn btn-primary" id="uploadButton" onClick={() => uploadChallenge(selectedClient)}>Upload Hot Topic</button>
        <img id="spinner" src="images/spinner.svg" />
      </div>

      {/*
      <div className="text-center">
        <button type="button" className="btn btn-primary" id="uploadButton" onClick={() => massUpload()}>Mass Upload Hot Topic</button>
        <img id="spinner" src="images/spinner.svg" />
      </div>
      */}

      <Footer />

      <Modal />

    </div>
  );
}

export default App;
