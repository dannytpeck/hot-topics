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

    const flourishingClients = clients.filter(client => client.fields['Flourishing Index'] === 'Web');

    $('#counter').html(`<p><span id="finishedUploads">0</span> / ${flourishingClients.length}</p>`);

    flourishingClients.map(client => {
      // console.log(client);
      uploadChallenge(client);
    });
  }

  function uploadChallenge(client) {
    // Open the modal
    $('#uploadModal').modal();

    const startDate = '2020-02-17';
    const endDate = '2020-03-17';

    const data = {
      'AboutChallenge': '',
      'ActivityReward': {
        'Type': 'IncentivePoints',
        'Value': '0'
      },
      'ActivityType': 'complete the assessment',
      'AmountUnit': '',
      'ChallengeLogoThumbURL': 'https://d2qv7eqemtyl41.cloudfront.net/PDW/c7a3a87d-d7d2-4273-8c53-943f656c4d0d-large.jpg',
      'ChallengeLogoURL': 'https://d2qv7eqemtyl41.cloudfront.net/PDW/c7a3a87d-d7d2-4273-8c53-943f656c4d0d-large.jpg',
      'ChallengeTarget': 1,
      'ChallengeType': 'OneTimeEvent',
      'Dimensions': [],
      'DisplayInProgram': startDate === moment(Date) ? true : false,  // sets true if the challenge starts today
      'DisplayPriority': null,
      'EndDate': endDate,
      'EventCode': '',
      'Frequency': 'None',
      'IsDeviceEnabled': false,
      'IsFeatured': null,
      'IsSelfReportEnabled': true,
      'IsTeamChallenge': false,
      'Name': 'Find Your Flourishing Score',
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
      const surveyUrl = `/api/Redirect?url=https%3A%2F%2Fheartbeat.adurolife.com%2Fapp%2Fsurvey%2F%3Fs%3D4f9e5f0d-d4bd-4306-bf42-40ccabca66e1%26q1%3D${result.Data.ChallengeId}%26q4%3D%5Bparticipantcode%5D%26q5%3D%5Be%5D`;

      $.ajax({
        url: 'https://api.limeade.com/api/admin/activity/' + result.Data.ChallengeId,
        type: 'PUT',
        dataType: 'json',
        data: JSON.stringify({
          'AboutChallenge': `<p>This five-minute assessment will give you the chance to reflect on different areas of your life and how they all tie together. Please respond to the questions on a scale from 0 to 10.</p><p>The Flourishing Index was developed by <a style="text-decoration: underline;" href="https://hfh.fas.harvard.edu/" target="_blank" rel="noopener">The Human Flourishing Program</a> at Harvard University. The background and motivation for these items and the flourishing domains can be found in: VanderWeele, T.J. (2017). <a style="text-decoration: underline;" href="https://www.pnas.org/content/114/31/8148" target="_blank" rel="noopener">On the promotion of human flourishing</a>. Proceedings of the National Academy of Sciences, U.S.A., 31:8148-8156.</p><p>You can access your results any time after you have completed the full assessment by clicking <a href="${surveyUrl}" target="_blank" rel="noopener">here</a>. After reporting your completion, you can find this tile in your History tab.</p><p>The Flourishing Index will be available for you to complete four times each year to provide real-time reflection on your life.</p><p><a href="${surveyUrl}" target="_blank" rel="noopener">CLICK HERE TO GET STARTED</a>.</p><p style="font-size: 0.7em;">&copy; Copyright 2020 <a style="text-decoration: none;" href="http://www.adurolife.com/" target="_blank" rel="noopener">ADURO, INC.</a> All rights reserved.</p>`
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

      <Footer />

      <Modal />

    </div>
  );
}

export default App;
