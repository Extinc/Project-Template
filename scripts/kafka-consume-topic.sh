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

echo "Preparing to consume Topic '$TOPIC_NAME'~~"

# Create topic using bootstrap connection
$KAFKA_PATH/bin/kafka-console-consumer.sh \
  --bootstrap-server $BOOTSTRAP_SERVER \
  --topic "$TOPIC_NAME" \
  --consumer.config $KAFKA_PATH/$KAFKA_IAM_CONFIG \
  --from-beginning 
