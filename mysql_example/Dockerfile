FROM node:alpine
MAINTAINER Euan Blackledge

ADD imagini /opt/app

WORKDIR /opt/app
RUN npm i

CMD [ "node", "/opt/app/imagini" ]