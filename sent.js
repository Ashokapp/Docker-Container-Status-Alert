const nodemailer = require('nodemailer');
const phin = require('phin')
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.user_email,
        pass: process.env.email_pass,
    },
});

let healthyContainerList = ['http://localhost:7512', 'http://localhost:15672', 'http://localhost:30001', 'http://localhost:8081', 'http://localhost:10000', 'http://localhost:8090', 'http://localhost:11000'];

let exitedContainerList = [];

const checkContainerStatus = async () => {

    if (healthyContainerList.length) {
        for (let i = 0; i < healthyContainerList.length; i++) {
            try {
                await phin({
                    method: 'GET',
                    url: healthyContainerList[i],
                });
            } catch (error) {
                const exitEle = healthyContainerList.splice(i, 1)[0];

                if (exitEle) {
                    exitedContainerList.push(exitEle);

                    const mailOptions = {
                        from: process.env.user_email,
                        to: process.env.to_email,
                        subject: 'Container Status Alert',
                        text: `The container ${exitEle} has exited.`,
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error(error);
                        } else {
                            console.log(`Email sent : the container has stopped - ${exitEle}`);
                        }
                    });
                }

            }
        }
    }

    if (exitedContainerList.length) {
        for (let i = 0; i < exitedContainerList.length; i++) {
            try {
                const response = await phin({
                    method: 'GET',
                    url: exitedContainerList[i],
                });
                if (response && response.statusCode === 200) {
                    const exitEle = exitedContainerList.splice(i, 1)[0];
                    if (exitEle) {
                        console.log(`the container started successfully - ${exitEle}`);
                        healthyContainerList.push(exitEle);
                    }
                }
            } catch (error) { }
        }
    }
}

setInterval(checkContainerStatus, 1000);