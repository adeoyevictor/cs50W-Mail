document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    document.querySelector('#compose-form').addEventListener('submit', send_email)
    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function reply_email(recipient, subject, timestamp, body) {

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    document.querySelector('#compose-recipients').value = recipient;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `On ${timestamp} ${recipient} wrote: ${body}\n`;
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            console.log(emails);
            emails.forEach(email => {
                const div = document.createElement('div')

                div.className = `email-div d-flex justify-content-between align-items-center border p-2 ${email.read ? 'bg-secondary text-white' : 'bg-white text-dark'} mb-2`
                div.innerHTML =
                    `<div class="d-flex">
                <p class="mr-2 mb-0"><b>${email.sender}</b></p>
                <p class="mb-0">${email.subject}</p>
                </div>
                <p class="mb-0"><small>${email.timestamp}</small></p>
                `
                div.addEventListener('click', () => get_email(email.id, mailbox))
                document.querySelector('#emails-view').appendChild(div)
            })
        });

}

function send_email(event) {
    event.preventDefault()
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
    }).then(response => response.json())
        .then(result => {
            if (result.message) {
                load_mailbox('sent')
            }
            if (result.error) {
                alert(result.error)
            }
        })
}

function get_email(id, mailbox) {
    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            console.log(email);
            load_email(email, mailbox)
            if (!email.read) {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        read: true
                    })
                })
            }

        })
}

function load_email(email, mailbox) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    document.querySelector('#email-view').innerHTML = `<p><b>From: </b>${email.sender}</p><p><b>To: </b>${email.recipients.join(', ')}</p><p><b>Subject: </b>${email.subject}</p><p><b>Timestamp: </b>${email.timestamp}</p>${mailbox === 'inbox' ? '<button class="mr-2 btn btn-sm btn-outline-primary" id="reply">Reply</button>' : ''}${mailbox === 'inbox' && !email.archived ? '<button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>' : ''}${mailbox === 'archive' && email.archived ? '<button class="btn btn-sm btn-outline-primary" id="unarchive">Unarchive</button>' : ''}
    <hr><p>${email.body}</p>`
    if (mailbox === 'inbox' && !email.archived) {
        document.getElementById("archive").addEventListener('click', () => archive(email.id))
    }
    if (mailbox === 'archive' && email.archived) {
        document.getElementById("unarchive").addEventListener('click', () => unarchive(email.id))
    }
    if (mailbox === 'inbox') {
        document.getElementById("reply").addEventListener('click', () => reply(email.sender, email.subject, email.timestamp, email.body))
    }
}

function reply(sender, subject, timestamp, body) {
    const actual_subject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`
    reply_email(sender, actual_subject, timestamp, body)
}
function archive(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    }).then(() => {
        load_mailbox('inbox')
    })
}
function unarchive(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
    }).then(() => {
        load_mailbox('inbox')
    })
}