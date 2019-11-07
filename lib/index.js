'use strict';

/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const AWS = require('aws-sdk');

const trimParam = str => (typeof str === 'string' ? str.trim() : undefined);

module.exports = {
  provider: 'aws-s3',
  name: 'Amazon Web Service S3 With Base Url And Prefix',
  auth: {
    public: {
      label: 'Access API Token',
      type: 'text',
    },
    private: {
      label: 'Secret Access Token',
      type: 'text',
    },
    region: {
      label: 'Region',
      type: 'enum',
      values: [
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'ca-central-1',
        'ap-south-1',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-northeast-3',
        'ap-southeast-1',
        'ap-southeast-2',
        'cn-north-1',
        'cn-northwest-1',
        'eu-central-1',
        'eu-north-1',
        'eu-west-1',
        'eu-west-2',
        'eu-west-3',
        'sa-east-1',
      ],
    },
    baseUrl: {
      label: 'Base URL, e.g. https://example.com',
      type: 'text'
    },
    bucket: {
      label: 'Bucket',
      type: 'text',
    },
    prefix: {
      label: "Key Prefix, e.g. uploads/",
      type: 'text'
    },
    setObjectPublic: {
      label: 'Set the object public accessible? ACL = public-read',
      type: 'enum',
      values: [
        "Public",
        "No Public"
      ]
    }
  },
  init: config => {
    // configure AWS S3 bucket connection
    AWS.config.update({
      accessKeyId: trimParam(config.public),
      secretAccessKey: trimParam(config.private),
      region: config.region,
    });

    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {
        Bucket: trimParam(config.bucket),
      },
    });

    return {
      upload: file => {
        return new Promise((resolve, reject) => {
          // upload file on S3 bucket
          const prefix = config.prefix.trim() === "/" ? "" : config.prefix.trim();
          const path = file.path ? `${file.path}/` : '';
          const objectKey = `${prefix}${path}${file.hash}${file.ext}`;
          S3.upload(Object.assign({
            Key: objectKey,
            Body: new Buffer(file.buffer, 'binary'),
            ContentType: file.mime,
          }, config.setObjectPublic === "Public" ? {ACL: 'public-read'} : {}), (err, data) => {
              if (err) {
                return reject(err);
              }

              // set the bucket file url
              file.url = `${config.baseUrl}/${objectKey}`;

              resolve();
            }
          );
        });
      },
      delete: file => {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const prefix = config.prefix.trim() === "/" ? "" : config.prefix.trim();
          const path = file.path ? `${file.path}/` : '';
          S3.deleteObject(
            {
              Key: `${prefix}${path}${file.hash}${file.ext}`,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};