const { CognitoIdentityProviderClient, ListUsersInGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const command = new ListUsersInGroupCommand({
      UserPoolId: process.env.USER_POOL_ID || 'ap-northeast-2_egqvLgHX0',
      GroupName: 'premium',
      Limit: 60
    });

    const response = await client.send(command);
    
    const users = response.Users.map(user => {
      const attributes = {};
      user.Attributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
      });

      return {
        username: user.Username,
        email: attributes.email,
        name: attributes.name || attributes.nickname || '',
        emailVerified: attributes.email_verified === 'true',
        createdAt: user.UserCreateDate,
        status: user.UserStatus
      };
    });

    console.log(`Found ${users.length} premium users`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({
        users,
        count: users.length
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({
        error: 'Failed to list premium users',
        details: error.message
      })
    };
  }
};