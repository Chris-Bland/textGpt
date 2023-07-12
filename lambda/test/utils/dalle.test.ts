import { generateImageUrl } from '../../utils/dalle.utils';
import { CreateImageRequestSizeEnum, OpenAIApi } from 'openai';

jest.mock('openai');

describe('generateImageUrl', () => {
  it('returns the generated image URL', async () => {
    const mockResponse = {
      data: {
        data: [
          {
            url: 'https://example.com/image.jpg'
          }
        ]
      }
    };

    // Mock the createImage function
    const createImageMock = jest.fn().mockResolvedValueOnce(mockResponse);
    const openaiMock = {
      createImage: createImageMock
    };
    const openai = openaiMock as unknown as OpenAIApi;

    const imagePrompt = 'Generate an image';
    const imageResolution: CreateImageRequestSizeEnum = '512x512';

    const result = await generateImageUrl(imagePrompt, openai, imageResolution);

    expect(result).toBe('https://example.com/image.jpg');
    expect(createImageMock).toHaveBeenCalledWith({
      prompt: JSON.stringify(imagePrompt),
      n: 1,
      size: imageResolution
    });
  });

  it('throws an error when the image URL is invalid', async () => {
    const mockResponse = {
      data: {
        data: []
      }
    };

    // Mock the createImage function
    const createImageMock = jest.fn().mockResolvedValueOnce(mockResponse);
    const openaiMock = {
      createImage: createImageMock
    };
    const openai = openaiMock as unknown as OpenAIApi;

    const imagePrompt = 'Generate an image';
    const imageResolution: CreateImageRequestSizeEnum = '512x512';

    await expect(generateImageUrl(imagePrompt, openai, imageResolution)).rejects.toThrow('Invalid ImageUrl');
    expect(createImageMock).toHaveBeenCalledWith({
      prompt: JSON.stringify(imagePrompt),
      n: 1,
      size: imageResolution
    });
  });

  it('throws an error when the API call fails', async () => {
    const mockError = new Error('API call failed');

    // Mock the createImage function to throw an error
    const createImageMock = jest.fn().mockRejectedValueOnce(mockError);
    const openaiMock = {
      createImage: createImageMock
    };
    const openai = openaiMock as unknown as OpenAIApi;

    const imagePrompt = 'Generate an image';
    const imageResolution: CreateImageRequestSizeEnum = '512x512';

    await expect(generateImageUrl(imagePrompt, openai, imageResolution)).rejects.toThrowError(mockError);
    expect(createImageMock).toHaveBeenCalledWith({
      prompt: JSON.stringify(imagePrompt),
      n: 1,
      size: imageResolution
    });
    expect(console.error).toHaveBeenCalledWith(`Failure during Dall-E call: ${JSON.stringify(mockError)}`);
  });
});
