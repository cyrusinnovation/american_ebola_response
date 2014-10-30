require 'csv'
require 'json'

class OutbreakData
	attr_accessor :all_data, :case_data, :death_data, :affected_countries, :dates

	def initialize(news_data, country_mapping)
		@all_data = []
		@case_data = []
		@death_data = []
		@dates = {}
		@news_data = news_data
		@country_mapping = country_mapping

		CSV.foreach('inputs/ebola_outbreak_data.csv') do |row|
			all_data << row
		end

		generate_headers
		generate_dates
	end

	def date(row)
		data = row[0].split('/')
		"#{data[2]}-#{data[0].rjust(2,'0')}-#{data[1].rjust(2,'0')}"
	end

	def generate_headers
		@headers = @all_data[0]
	end

	def generate_dates
		@dates = outbreak_data.keys.sort
	end

	def data_for(row)
		data = []
		row.each_with_index do |field, index|
			next if index == 0
			cases, deaths = field.split('/')
			country = @headers[index]
			data << { code: @country_mapping[country], cases: cases, deaths: deaths } if cases.to_i > 0
		end

		data
	end

	def outbreak_data
		return @outbreak_data if @outbreak_data
		@outbreak_data = @all_data.each_with_index.inject({}) do |memo, (row, index)|
			next memo if index == 0
			memo[date(row)] = { outbreak: data_for(row) }
			memo
		end

		@sorted_dates = @outbreak_data.keys.sort
		merge_in_outbreak_news

		@outbreak_data
	end

	def current_or_previous_outbreak_data(date)
		return @outbreak_data[date] if @outbreak_data[date]
		index = @sorted_dates.index { |outbreak_date| outbreak_date > date }
		return @outbreak_data[@sorted_dates.last] unless index
		@outbreak_data[@sorted_dates[index - 1]]
	end

	def merge_in_outbreak_news
		@news_data.news.keys.each do |date|
			outbreak = current_or_previous_outbreak_data(date).clone
			outbreak[:news] = @news_data.news[date]
			outbreak[:news][:date] = date
			@outbreak_data[date] = outbreak
		end
	end

	def write_outbreak_json
		File.open("outputs/outbreak_data.json","w") do |f|
  			f.write(outbreak_data.to_json)
		end		
	end
end
