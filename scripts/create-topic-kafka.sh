#!/bin/sh

# Variables
IAM_AUTH_VERSION=2.3.0

KAFKA_PATH="/path/to/kafka" # Change this to your Kafka  directory
KAFKA_IAM_CONFIG="client.properties"  # Change this to your Kafka bin directory
PARTITIONS=1                         # Number of partitions
REPLICATION_FACTOR=1                 # Replication factor
BOOTSTRAP_SERVER="localhost:2181"    # Kafka bootstrap server

export CLASSPATH=$KAFKA_PATH/libs/*:$KAFKA_PATH/libs/aws-msk-iam-auth-$IAM_AUTH_VERSION-all.jar

echo $CLASSPATH

echo "Enter the Kafka topic name to create:"
read TOPIC_NAME

# Create topic using Zookeeper connection
$KAFKA_PATH/bin/kafka-topics.sh \
  --bootstrap-server $BOOTSTRAP_SERVER \
  --create \
  --topic "$TOPIC_NAME" \
  --command-config $KAFKA_PATH/$KAFKA_IAM_CONFIG \
  --partitions $PARTITIONS \
  --replication-factor $REPLICATION_FACTOR \

echo "Topic '$TOPIC_NAME' created."
