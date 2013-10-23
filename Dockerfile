FROM    ubuntu:latest

# --- Installing MongoDB
# Add 10gen official apt source to the sources list
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/10gen.list
# Hack for initctl not being available in Ubuntu
RUN dpkg-divert --local --rename --add /sbin/initctl
RUN ln -s /bin/true /sbin/initctl
# Install MongoDB
RUN apt-get update
RUN apt-get install mongodb-10gen
# Create the MongoDB data directory
RUN mkdir -p /data/db
EXPOSE 27017
ENTRYPOINT ["usr/bin/mongod"]

# --- Installing Node.js

RUN apt-get install -y python-software-properties python python-setuptools ruby rubygems
RUN add-apt-repository ppa:chris-lea/node.js
RUN echo "deb http://us.archive.ubuntu.com/ubuntu/ precise universe" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y nodejs 

# Removed unnecessary packages
RUN apt-get purge -y python-software-properties python python-setuptools ruby rubygems
RUN apt-get autoremove -y

# Clear package repository cache
RUN apt-get clean all

# --- Bundle app source
ADD . /src
# Install app dependencies
RUN cd /src; npm install

EXPOSE  8080
CMD ["node", "/src/start.js"]
