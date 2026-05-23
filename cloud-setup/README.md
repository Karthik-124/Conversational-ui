# Cloud Setup (AWS EC2)

This document describes how the conversational-interface backend and frontend is deployed on AWS EC2 using the Free Tier.

A single EC2 instance is used to host:
- Python (Flask) backend 
- Frontend

 Backend and the frontend run on different ports.

---

## Overview

- Cloud Provider: AWS EC2
- OS: Amazon Linux
- Instance Type: t3.micro


---

## Network Configuration (Security Groups)

The following inbound rules are enabled on the EC2 Security Group:

| Port | Service              | Purpose       |
|-----:|----------------------|-------------  |
| 5000 | Python Flask Backend | `/chat` API   |
| 80   | Nginx web server     | Frontend UI   |
| 22   |  SSH                 |Remote Terminal|


Source for all ports: 0.0.0.0/0

## AWS Account & EC2 Instance Creation

Go to https://aws.amazon.com

Click Sign In to the Console,enter all the required details and keep proceeding.

Login using your AWS account credentials

In the AWS Console, search for EC2

Click Launch Instance

Choose Amazon Linux

Select a Free Tier eligible instance type

Create or select a key pair (.pem file) and download it. (key.pem)

Allow SSH (port 22) in network settings

Click Launch Instance

After launch, note down the Public IPv4 address.

## Security Groups

To allow external access to the backend services:

Go to EC2 → Instances

Click on the created instance

Open the Security tab

Click the Security Group link(highlighted in blue)

Select Edit inbound rules.
Click on the add rule.
Select TCP.

Add the rules mentioned above.

Click Save rules

### Project Setup
In EC2->Instance, click on Connect and select public link.
In the opened EC2 terminal :-
```
git clone https://github.com/prasenjitb-cloud/conversational-interface.git

cd conversational-interface
```


### Deployment (Python Backend)

Run these commands :-
```
sudo yum update -y
sudo yum install python3 -y
sudo yum install python3-pip -y
pip3 install -r requirements.txt

```

## Run the Flask app

```
cd backend
cd echo-server
python3 app.py
```
## Run using nohup to keep the process alive after logout
```
nohup python3 app.py > flask.log 2>&1 &
```

The Flask backend is deployed on AWS EC2 (Free Tier).

- Cloud Provider: AWS EC2 (Amazon Linux)
- Public IP: 16.16.38.89
- Port: 5000

## Live Test URL
GET:
http://16.16.38.89:5000/chat?message=hello

This url is used to test Flask Backend API.

This endpoint is accessible from both desktop and mobile browsers.

### Notes
- Port 5000 is enabled via EC2 Security Group inbound rules.
- Flask is currently running using the built-in development server.

## Deployment (Nginx frontend)

To Install Nginx Run:-
```
sudo yum update -y
sudo yum install nginx -y
```

Move Frontend files to nginx html directory:-
```
sudo cp -r /home/ec2-user/conversational-interface/server/frontend/* /usr/share/nginx/html/
```

To Run:-
``` 
sudo systemctl start nginx
sudo systemctl enable nginx
``` 


The nginx Server is deployed on AWS EC2 (Free Tier).

- Cloud Provider: AWS EC2 (Amazon Linux)
- Public IP: 16.16.38.89
- Port: 80

### Notes 
1.Port 80 is enabled via EC2 Security Group inbound rules.

2.Add these in nginx config so that nginx doesn't die waiting for backend response ,
to get into config:-

```sudo nano /etc/nginx/nginx.conf```

```

location /chat {
    proxy_pass http://127.0.0.1:5001/chat;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    ... ( other proxy_set_header lines)
}

```

3. Add this in config for reverse proxy, some providers might block port 5001

```
location /chat {
        proxy_pass http://127.0.0.1:5001/chat;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
 ```   

 4. Everytime you change something in frontend:-
 ```
 sudo cp -r server/frontend/* /usr/share/nginx/html/
 ```


### Live Test URL

http://16.16.38.89/

This url is used to test the frontend.

## Note 
 If the instance is stopped and started, the Public IP will change.
 Ensure the Frontend code is updated with the new IPv4 address.