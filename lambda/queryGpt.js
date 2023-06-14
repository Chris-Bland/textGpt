exports.handler = async function(event) {
    console.log(`QueryGPT Lambda -- request: ${JSON.stringify(event, undefined, 2)}`);
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: `You've hit query: ${event.path}\n`
    };
  };